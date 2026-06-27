// backend/agents/historyAgent.ts
//
// historyAgent: eventId -> shallow historical context card.
//   - snapshot : the last CACHED implied probs per venue (written by priceAgent),
//                falling back to the mock baked into events.ts.
//   - context  : ONE Exa news call (cache-first so the tab stays cheap), with
//                source links. No stats pipeline — this is intentionally shallow.
//
// Resilience matches the rest of the app: live success is cached; on failure we
// fall back to cache, then to the mock sources in events.ts.

import { EVENTS, getEventById, type DemoEvent } from "../data/events";
import { readCache, writeCache } from "../lib/cache";

const TIMEOUT_MS = 10000;

export interface HistorySnapshot {
  venue: string;
  impliedProb: number;
  rawPrice: string;
  fromCache: boolean;
}

export interface HistoryCard {
  eventId: string;
  title: string;
  side: string;
  category: string;
  snapshot: HistorySnapshot[];
  snapshotAt: string | null;
  context: string;
  sources: { title: string; url: string }[];
  isLive: boolean;
}

interface CachedPrice {
  impliedProb: number;
  rawPrice: string;
}

async function buildSnapshot(
  event: DemoEvent
): Promise<{ snapshot: HistorySnapshot[]; snapshotAt: string | null }> {
  let latest: string | null = null;
  const snapshot: HistorySnapshot[] = [];

  for (const v of event.venues) {
    const cached = await readCache<CachedPrice>(`price-${event.id}-${v.venue}`);
    if (cached) {
      snapshot.push({
        venue: v.venue,
        impliedProb: cached.data.impliedProb,
        rawPrice: cached.data.rawPrice,
        fromCache: true,
      });
      if (!latest || cached.fetchedAt > latest) latest = cached.fetchedAt;
    } else {
      snapshot.push({
        venue: v.venue,
        impliedProb: v.mockImpliedProb,
        rawPrice: v.mockRawPrice,
        fromCache: false,
      });
    }
  }

  return { snapshot, snapshotAt: latest };
}

interface ExaNews {
  title?: string;
  url: string;
  summary?: string;
  highlights?: string[];
}

async function exaNews(apiKey: string, query: string): Promise<ExaNews[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        query,
        category: "news",
        numResults: 3,
        contents: { summary: true },
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.results ?? []) as ExaNews[];
  } finally {
    clearTimeout(t);
  }
}

interface CachedContext {
  context: string;
  sources: { title: string; url: string }[];
}

async function buildContext(event: DemoEvent): Promise<{ ctx: CachedContext; isLive: boolean }> {
  const cacheKey = `history-${event.id}`;

  // Cache-first: keep the History tab cheap (one call ever, until cache cleared).
  const cached = await readCache<CachedContext>(cacheKey);
  if (cached) return { ctx: cached.data, isLive: false };

  const apiKey = process.env.EXA_API_KEY;
  if (apiKey) {
    try {
      const results = await exaNews(apiKey, `${event.side} 2026 World Cup recent form result history`);
      if (results.length > 0) {
        const ctx: CachedContext = {
          context:
            results[0].summary ??
            results[0].highlights?.join(" ") ??
            `Recent coverage of ${event.side} at the 2026 World Cup.`,
          sources: results.slice(0, 3).map((r) => ({ title: r.title ?? r.url, url: r.url })),
        };
        await writeCache(cacheKey, ctx);
        return { ctx, isLive: true };
      }
    } catch {
      // fall through to mock
    }
  }

  // Mock fallback from events.ts.
  return {
    ctx: { context: event.mockResearch.summary, sources: event.mockResearch.sources },
    isLive: false,
  };
}

export async function historyAgent(eventId: string): Promise<HistoryCard | null> {
  const event = getEventById(eventId);
  if (!event) return null;

  const [{ snapshot, snapshotAt }, { ctx, isLive }] = await Promise.all([
    buildSnapshot(event),
    buildContext(event),
  ]);

  return {
    eventId: event.id,
    title: event.title,
    side: event.side,
    category: event.category,
    snapshot,
    snapshotAt,
    context: ctx.context,
    sources: ctx.sources,
    isLive,
  };
}

export async function historyAll(): Promise<HistoryCard[]> {
  const cards = await Promise.all(EVENTS.map((e) => historyAgent(e.id)));
  return cards.filter((c): c is HistoryCard => c !== null);
}
