// backend/agents/synthesisAgent.ts
//
// synthesisAgent: combine prices + research -> the result-card payload.
// Orchestrates priceAgent then researchAgent, computes the best price and the
// cross-venue divergence, and returns the ScanResult the UI renders.

import { getEventById } from "../data/events";
import type { ScanResult, VenuePrice } from "../lib/types";
import { priceAgent } from "./priceAgent";
import { researchAgent } from "./researchAgent";

function bestVenue(prices: VenuePrice[]): VenuePrice | null {
  // Best price to BACK the side = lowest implied prob (highest payout).
  return prices.reduce<VenuePrice | null>((best, p) => (!best || p.impliedProb < best.impliedProb ? p : best), null);
}

function divergencePoints(prices: VenuePrice[]): number {
  if (prices.length === 0) return 0;
  const probs = prices.map((p) => p.impliedProb);
  return (Math.max(...probs) - Math.min(...probs)) * 100;
}

export async function synthesisAgent(eventId: string): Promise<ScanResult | null> {
  const event = getEventById(eventId);
  if (!event) return null;

  const prices = await priceAgent(eventId);

  // Feed Polymarket vs sportsbook probabilities into the research prompt.
  const marketProb = prices.find((p) => p.venue === "Polymarket")?.impliedProb ?? 0;
  const bookProb = prices.find((p) => p.venue === "Sportsbook")?.impliedProb ?? 0;
  const research = await researchAgent(eventId, { marketProb, bookProb });

  const best = bestVenue(prices);

  return {
    eventId: event.id,
    title: event.title,
    side: event.side,
    category: event.category,
    prices,
    bestVenue: best?.venue ?? prices[0]?.venue ?? "Polymarket",
    divergencePts: Math.round(divergencePoints(prices) * 10) / 10,
    research,
    anyLive: prices.some((p) => p.isLive) || research.isLive,
  };
}
