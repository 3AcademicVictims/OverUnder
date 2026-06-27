// frontend/lib/betStats.ts
//
// Pure helpers that turn a list of Bets into the numbers the My Bets tab shows.
// Everything derives from the stored implied odds — no backend.

import type { Bet } from "./bets";

/**
 * Profit/loss for a single bet, in dollars.
 *  - won  : decimal odds = 1 / impliedProb, so profit = stake * (1/p - 1)
 *  - lost : -stake
 *  - open : 0 (unsettled)
 */
export function betProfit(bet: Bet): number {
  if (bet.status === "won") {
    const p = bet.oddsAtBet;
    if (!p || p <= 0) return 0;
    return bet.stake * (1 / p - 1);
  }
  if (bet.status === "lost") return -bet.stake;
  return 0;
}

export interface BetSummary {
  total: number;
  open: number;
  settled: number;
  wins: number;
  losses: number;
  winRatePct: number; // over settled bets
  totalStaked: number;
  realizedPnl: number; // over settled bets
}

export function summarize(bets: Bet[]): BetSummary {
  const settledBets = bets.filter((b) => b.status !== "open");
  const wins = settledBets.filter((b) => b.status === "won").length;
  const losses = settledBets.filter((b) => b.status === "lost").length;
  const realizedPnl = settledBets.reduce((sum, b) => sum + betProfit(b), 0);
  return {
    total: bets.length,
    open: bets.length - settledBets.length,
    settled: settledBets.length,
    wins,
    losses,
    winRatePct: settledBets.length ? (wins / settledBets.length) * 100 : 0,
    totalStaked: bets.reduce((sum, b) => sum + b.stake, 0),
    realizedPnl,
  };
}

/**
 * Current streak from settled bets: positive = trailing win streak,
 * negative = trailing loss streak, 0 = no settled bets.
 */
export function currentStreak(bets: Bet[]): number {
  const settled = bets
    .filter((b) => b.status !== "open")
    .sort((a, b) => a.placedAt.localeCompare(b.placedAt));
  if (settled.length === 0) return 0;
  const last = settled[settled.length - 1].status;
  let count = 0;
  for (let i = settled.length - 1; i >= 0; i--) {
    if (settled[i].status !== last) break;
    count++;
  }
  return last === "won" ? count : -count;
}

export interface PnlPoint {
  label: string;
  cumulative: number;
}

/**
 * Cumulative realized P/L over settled bets, ordered by placement time.
 * Starts at a zero baseline so the line has a clear origin.
 */
export function cumulativePnlSeries(bets: Bet[]): PnlPoint[] {
  const settled = bets
    .filter((b) => b.status !== "open")
    .sort((a, b) => a.placedAt.localeCompare(b.placedAt));

  const points: PnlPoint[] = [{ label: "Start", cumulative: 0 }];
  let running = 0;
  settled.forEach((b, i) => {
    running += betProfit(b);
    points.push({ label: `#${i + 1} ${b.side}`, cumulative: Math.round(running * 100) / 100 });
  });
  return points;
}
