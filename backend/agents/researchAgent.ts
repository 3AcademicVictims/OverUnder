// backend/agents/researchAgent.ts
//
// researchAgent: eventId -> Exa news + tweets -> OpenAI sentiment synthesis with
// citations. Implements skills/exa-research.md.
//
// Pipeline:
//   1. Exa /search category:"news"  (primary, reliable)
//   2. Exa /search category:"tweet" (best-effort secondary)
//   3. OpenAI synthesis: "given these sources, and Polymarket implies X% vs the
//      book's Y%, explain in 2 sentences why the market may price this
//      differently. Cite each claim with its source URL."
//
// Resilience: the synthesized result is cached to data/cache/. On ANY failure we
// fall back to the last cached research, then to the mock baked into events.ts.
// Every source rendered in the UI carries a clickable URL.

import { getEventById } from "../data/events";
import type { Research, ResearchSource } from "../lib/types";
import { readCache, writeCache } from "../lib/cache";

const TIMEOUT_MS = 12000;

interface PriceContext {
  /** Polymarket implied prob (0..1), for the synthesis prompt. */
  marketProb: number;
  /** Sportsbook implied prob (0..1), for the synthesis prompt. */
  bookProb: number;
}

interface ExaResult {
  title?: string;
  url: string;
  publishedDate?: string;
  summary?: string;
  highlights?: string[];
  text?: string;
}

async function fetchJson(url: string, init: RequestInit): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function sevenDaysAgoISO(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

async function exaSearch(
  apiKey: string,
  query: string,
  category: "news" | "tweet"
): Promise<ExaResult[]> {
  const body: Record<string, unknown> =
    category === "news"
      ? {
          query,
          category: "news",
          numResults: 5,
          startPublishedDate: sevenDaysAgoISO(),
          contents: { highlights: true, summary: true },
        }
      : { query, category: "tweet", numResults: 5, type: "auto" };

  const data = await fetchJson("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(body),
  });
  return (data?.results ?? []) as ExaResult[];
}

async function openAiSynthesis(
  apiKey: string,
  event: { title: string; side: string },
  ctx: PriceContext,
  news: ExaResult[],
  tweets: ExaResult[]
): Promise<{ summary: string; sentiment: "bull" | "bear" | "mixed" }> {
  const sourceLines = [...news, ...tweets]
    .slice(0, 10)
    .map((r, i) => `[${i + 1}] ${r.title ?? "untitled"} (${r.url})\n${r.summary ?? r.highlights?.join(" ") ?? ""}`)
    .join("\n\n");

  const prompt = `You are analyzing why betting venues disagree on: "${event.title}".
Polymarket implies ${(ctx.marketProb * 100).toFixed(1)}% for ${event.side}; the sportsbook implies ${(ctx.bookProb * 100).toFixed(1)}%.

Sources:
${sourceLines}

In exactly 2 sentences, explain why the market may be pricing this differently. Cite each claim by referencing its source number like [1]. Then classify the overall signal for ${event.side} as bull, bear, or mixed.
Respond ONLY as JSON: {"summary": string, "sentiment": "bull"|"bear"|"mixed"}.`;

  const data = await fetchJson("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  const content = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  const sentiment = ["bull", "bear", "mixed"].includes(parsed.sentiment) ? parsed.sentiment : "mixed";
  return { summary: String(parsed.summary ?? "").trim() || "No synthesis available.", sentiment };
}

function toSources(news: ExaResult[], tweets: ExaResult[]): ResearchSource[] {
  const seen = new Set<string>();
  const out: ResearchSource[] = [];
  for (const r of [...news, ...tweets]) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    out.push({ title: r.title ?? r.url, url: r.url });
    if (out.length >= 5) break;
  }
  return out;
}

export async function researchAgent(eventId: string, ctx: PriceContext): Promise<Research> {
  const event = getEventById(eventId);
  if (!event) {
    return { summary: "Unknown event.", sentiment: "mixed", sources: [], isLive: false, fromCache: false };
  }

  const cacheKey = `research-${eventId}`;
  const exaKey = process.env.EXA_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  try {
    if (!exaKey) throw new Error("no EXA_API_KEY");
    const query = `${event.side} 2026 World Cup injury news lineup form`;

    const news = await exaSearch(exaKey, query, "news");
    // tweets are best-effort; don't fail the whole agent if they error.
    let tweets: ExaResult[] = [];
    try {
      tweets = await exaSearch(exaKey, query, "tweet");
    } catch {
      tweets = [];
    }

    const sources = toSources(news, tweets);

    let summary: string;
    let sentiment: "bull" | "bear" | "mixed";
    if (openAiKey) {
      ({ summary, sentiment } = await openAiSynthesis(openAiKey, event, ctx, news, tweets));
    } else {
      // No OpenAI key: still ship a real, sourced result from Exa summaries.
      summary =
        news[0]?.summary ??
        news[0]?.highlights?.join(" ") ??
        "Live sources fetched; add OPENAI_API_KEY for a synthesized explanation.";
      sentiment = "mixed";
    }

    const research: Research = { summary, sentiment, sources, isLive: true, fromCache: false };
    await writeCache(cacheKey, research);
    return research;
  } catch {
    const cached = await readCache<Research>(cacheKey);
    if (cached) return { ...cached.data, isLive: false, fromCache: true };

    const m = event.mockResearch;
    return { summary: m.summary, sentiment: m.sentiment, sources: m.sources, isLive: false, fromCache: false };
  }
}
