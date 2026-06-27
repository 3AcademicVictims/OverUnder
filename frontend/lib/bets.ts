// frontend/lib/bets.ts
//
// Client-only bet store backed by localStorage. No backend, no auth (per the
// dashboard brief). "Track this bet" on the Scanner writes here; the My Bets tab
// reads/updates here. All functions are safe to call on the server (they no-op
// without `window`).

export type BetStatus = "open" | "won" | "lost";

export interface Bet {
  id: string;
  eventId: string;
  eventTitle: string;
  side: string;
  venue: string;
  /** Implied probability at time of bet, 0..1. */
  oddsAtBet: number;
  /** Human-readable price as shown on the venue. */
  rawPrice: string;
  stake: number;
  status: BetStatus;
  placedAt: string; // ISO
}

const KEY = "overunder.bets.v1";
const CHANGED_EVENT = "overunder:bets-changed";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function uid(): string {
  if (hasWindow() && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `bet_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export function getBets(): Bet[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Bet[]) : [];
  } catch {
    return [];
  }
}

function persist(bets: Bet[]): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bets));
    // Let other tabs/components react without a full reload.
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  } catch {
    // storage full / blocked — ignore
  }
}

export function addBet(input: Omit<Bet, "id" | "placedAt" | "status"> & { status?: BetStatus }): Bet {
  const bet: Bet = {
    ...input,
    status: input.status ?? "open",
    id: uid(),
    placedAt: new Date().toISOString(),
  };
  persist([bet, ...getBets()]);
  return bet;
}

export function updateBet(id: string, patch: Partial<Bet>): void {
  persist(getBets().map((b) => (b.id === id ? { ...b, ...patch } : b)));
}

export function removeBet(id: string): void {
  persist(getBets().filter((b) => b.id !== id));
}

/** Subscribe to bet changes (same-tab custom event + cross-tab storage event). */
export function onBetsChanged(cb: () => void): () => void {
  if (!hasWindow()) return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
