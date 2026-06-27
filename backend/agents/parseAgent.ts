// backend/agents/parseAgent.ts
//
// parseAgent: query string -> { eventId }
// A deliberately simple fuzzy match against the hardcoded demo events. No NLP,
// no entity resolution — we score each event by keyword/title token overlap and
// return the best one (or null if nothing meaningfully matches).

import { EVENTS, type DemoEvent } from "../data/events";

export interface ParseResult {
  eventId: string | null;
  event: DemoEvent | null;
  score: number;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function parseAgent(query: string): ParseResult {
  const q = tokenize(query);
  if (q.length === 0) return { eventId: null, event: null, score: 0 };

  let best: DemoEvent | null = null;
  let bestScore = 0;

  for (const event of EVENTS) {
    const haystack = new Set([
      ...event.keywords.map((k) => k.toLowerCase()),
      ...tokenize(event.title),
      ...tokenize(event.side),
      ...tokenize(event.category),
    ]);

    let score = 0;
    for (const token of q) {
      if (haystack.has(token)) score += 2;
      // partial credit for prefix matches (e.g. "eng" -> "england")
      else if ([...haystack].some((h) => h.length >= 3 && (h.startsWith(token) || token.startsWith(h)))) {
        score += 1;
      }
    }
    // Reward matching the distinctive side name strongly.
    if (q.includes(event.side.toLowerCase())) score += 3;

    if (score > bestScore) {
      bestScore = score;
      best = event;
    }
  }

  // Require at least a minimal signal so gibberish returns nothing.
  if (!best || bestScore < 2) return { eventId: null, event: null, score: bestScore };
  return { eventId: best.id, event: best, score: bestScore };
}
