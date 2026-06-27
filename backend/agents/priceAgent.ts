// backend/agents/priceAgent.ts
//
// priceAgent: eventId -> normalized implied probs from 3 venues.
//
// Implements skills/odds-normalisation.md:
//   - Polymarket Gamma : outcomePrices[0] (YES) IS the implied prob. No vig.
//   - Kalshi           : midpoint of yes_bid/yes_ask, /100. No vig.
//   - Sportsbook (Odds API): de-vig. For a futures/outright field we strip the
//     overround across the WHOLE field (generalizes the skill's 2-way formula).
//
// Resilience (AGENTS.md): every successful response is written to data/cache/.
// On ANY failure (missing key, network, parse) we fall back to the last cached
// value, and finally to the mock baked into data/events.ts. The card always
// renders.

import { getEventById, type VenueRef } from "../data/events";
import type { VenuePrice } from "../lib/types";
import { readCache, writeCache } from "../lib/cache";

const TIMEOUT_MS = 6000;

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

interface LivePrice {
  impliedProb: number;
  rawPrice: string;
}

// ---- per-venue normalizers -------------------------------------------------

async function fetchPolymarket(ref: VenueRef): Promise<LivePrice> {
  if (!ref.polymarketId) throw new Error("no polymarket id");
  const data = await fetchJson(`https://gamma-api.polymarket.com/markets?id=${ref.polymarketId}`);
  const market = Array.isArray(data) ? data[0] : data;
  if (!market) throw new Error("polymarket: empty");
  // outcomePrices is a JSON-encoded string array, e.g. '["0.22","0.78"]'.
  const raw = market.outcomePrices;
  const prices: string[] = typeof raw === "string" ? JSON.parse(raw) : raw;
  const yes = parseFloat(prices?.[0]);
  if (!isFinite(yes)) throw new Error("polymarket: bad price");
  return { impliedProb: yes, rawPrice: `$${yes.toFixed(2)}` };
}

async function fetchKalshi(ref: VenueRef): Promise<LivePrice> {
  if (!ref.kalshiTicker) throw new Error("no kalshi ticker");
  const data = await fetchJson(
    `https://api.elections.kalshi.com/trade-api/v2/markets/${ref.kalshiTicker}`
  );
  const m = data?.market ?? data;

  // The live API returns dollar-denominated quotes (yes_bid_dollars ~ "0.116",
  // already a probability). Older/cents responses use yes_bid in cents. Prefer
  // dollars, fall back to cents/100, so both shapes work.
  const bidD = Number(m?.yes_bid_dollars);
  const askD = Number(m?.yes_ask_dollars);
  let prob: number;
  if (isFinite(bidD) && isFinite(askD)) {
    prob = (bidD + askD) / 2;
  } else {
    const bid = Number(m?.yes_bid);
    const ask = Number(m?.yes_ask);
    if (!isFinite(bid) || !isFinite(ask)) throw new Error("kalshi: bad quote");
    prob = (bid + ask) / 2 / 100;
  }
  return { impliedProb: prob, rawPrice: `${(prob * 100).toFixed(1)}¢ (yes mid)` };
}

async function fetchSportsbook(ref: VenueRef): Promise<LivePrice> {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("no ODDS_API_KEY");
  if (!ref.oddsApiSport || !ref.oddsApiOutcome) throw new Error("no odds-api mapping");

  // Futures winner markets are "outrights"; fall back to h2h if needed.
  const base = `https://api.the-odds-api.com/v4/sports/${ref.oddsApiSport}/odds/`;
  const qs = `?regions=us&oddsFormat=decimal&apiKey=${key}`;
  let data: any;
  try {
    data = await fetchJson(`${base}${qs}&markets=outrights`);
  } catch {
    data = await fetchJson(`${base}${qs}&markets=h2h`);
  }

  // Collect every outcome across bookmakers; de-vig per bookmaker, then average.
  const events: any[] = Array.isArray(data) ? data : [];
  const fairProbs: number[] = [];
  let matchedDecimal: number | null = null;

  for (const ev of events) {
    for (const bk of ev.bookmakers ?? []) {
      for (const mk of bk.markets ?? []) {
        const outcomes: any[] = mk.outcomes ?? [];
        const rawImplied = outcomes.map((o) => 1 / Number(o.price));
        const overround = rawImplied.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
        if (overround <= 0) continue;
        const idx = outcomes.findIndex(
          (o) => String(o.name).toLowerCase() === ref.oddsApiOutcome!.toLowerCase()
        );
        if (idx === -1) continue;
        fairProbs.push(rawImplied[idx] / overround);
        if (matchedDecimal == null) matchedDecimal = Number(outcomes[idx].price);
      }
    }
  }

  if (fairProbs.length === 0) throw new Error("odds-api: outcome not found");
  const fair = fairProbs.reduce((a, b) => a + b, 0) / fairProbs.length;
  const dec = matchedDecimal ?? 1 / fair;
  return { impliedProb: fair, rawPrice: `${dec.toFixed(2)} dec (de-vigged)` };
}

async function priceOneVenue(eventId: string, ref: VenueRef): Promise<VenuePrice> {
  const cacheKey = `price-${eventId}-${ref.venue}`;
  const base = {
    venue: ref.venue,
    label: ref.label,
    sourceUrl: ref.sourceUrl,
  };

  try {
    let live: LivePrice;
    if (ref.venue === "Polymarket") live = await fetchPolymarket(ref);
    else if (ref.venue === "Kalshi") live = await fetchKalshi(ref);
    else live = await fetchSportsbook(ref);

    await writeCache(cacheKey, live);
    return { ...base, impliedProb: live.impliedProb, rawPrice: live.rawPrice, isLive: true, fromCache: false };
  } catch (err) {
    // 1) cache, 2) mock
    const cached = await readCache<LivePrice>(cacheKey);
    if (cached) {
      return {
        ...base,
        impliedProb: cached.data.impliedProb,
        rawPrice: cached.data.rawPrice,
        isLive: false,
        fromCache: true,
      };
    }
    return {
      ...base,
      impliedProb: ref.mockImpliedProb,
      rawPrice: ref.mockRawPrice,
      isLive: false,
      fromCache: false,
    };
  }
}

export async function priceAgent(eventId: string): Promise<VenuePrice[]> {
  const event = getEventById(eventId);
  if (!event) return [];
  return Promise.all(event.venues.map((ref) => priceOneVenue(eventId, ref)));
}
