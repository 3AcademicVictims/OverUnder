// backend/data/friends.ts
//
// DEMO DATA ONLY. Four hardcoded "friends" for the Leaderboard tab — there are
// no accounts, no invites, no real social graph. The live user (computed from
// the local My Bets store) is inserted into this ranking on the client.
//
// streak: positive = current win streak, negative = current loss streak.

export interface Friend {
  id: string;
  name: string;
  avatar: string; // emoji
  winRatePct: number;
  pnl: number;
  streak: number;
}

export const FRIENDS: Friend[] = [
  { id: "f1", name: "Mia “Sharp” Chen", avatar: "🦈", winRatePct: 64, pnl: 412.5, streak: 4 },
  { id: "f2", name: "Deon Park", avatar: "🎯", winRatePct: 57, pnl: 188.0, streak: 2 },
  { id: "f3", name: "Priya R.", avatar: "🔮", winRatePct: 49, pnl: -36.25, streak: -1 },
  { id: "f4", name: "Tommy Two-Touch", avatar: "⚽", winRatePct: 41, pnl: -120.75, streak: -3 },
];
