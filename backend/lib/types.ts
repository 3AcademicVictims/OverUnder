// backend/lib/types.ts — shared shapes that flow between the pipeline agents.

import type { VenueName, MockSource } from "../data/events";

export type { VenueName };

/** One venue's normalized price for the chosen side. */
export interface VenuePrice {
  venue: VenueName;
  label: string;
  /** Implied probability of the chosen side, 0..1. */
  impliedProb: number;
  /** Human-readable raw price as quoted by the venue. */
  rawPrice: string;
  sourceUrl: string;
  /** true when this number came from a live API call this request. */
  isLive: boolean;
  /** true when it was served from the on-disk cache (API failed/missing key). */
  fromCache: boolean;
}

export interface ResearchSource extends MockSource {}

export interface Research {
  summary: string;
  sentiment: "bull" | "bear" | "mixed";
  sources: ResearchSource[];
  isLive: boolean;
  fromCache: boolean;
}

/** Final payload rendered by the result card (output of synthesisAgent). */
export interface ScanResult {
  eventId: string;
  title: string;
  side: string;
  category: string;
  prices: VenuePrice[];
  /** Venue offering the best price to back the side (lowest implied prob). */
  bestVenue: VenueName;
  /** Divergence in percentage points: max(prob) - min(prob), ×100. */
  divergencePts: number;
  research: Research;
  /** true when at least one venue price OR the research came from a live API. */
  anyLive: boolean;
}
