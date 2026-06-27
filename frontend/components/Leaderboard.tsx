"use client";

import { useEffect, useState } from "react";
import { getBets, onBetsChanged } from "@/lib/bets";
import { currentStreak, summarize } from "@/lib/betStats";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  winRatePct: number;
  pnl: number;
  streak: number;
}

interface Row extends Friend {
  isUser: boolean;
}

function money(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function streakLabel(s: number): string {
  if (s === 0) return "—";
  return s > 0 ? `W${s}` : `L${Math.abs(s)}`;
}

export default function Leaderboard() {
  const [mounted, setMounted] = useState(false);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [userRow, setUserRow] = useState<Friend | null>(null);

  useEffect(() => {
    setMounted(true);

    const computeUser = () => {
      const bets = getBets();
      const s = summarize(bets);
      setUserRow({
        id: "you",
        name: "You",
        avatar: "🫵",
        winRatePct: Math.round(s.winRatePct),
        pnl: s.realizedPnl,
        streak: currentStreak(bets),
      });
    };

    computeUser();
    const unsub = onBetsChanged(computeUser);

    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => setFriends(d.friends ?? []))
      .catch(() => setFriends([]));

    return unsub;
  }, []);

  // Loading
  if (!mounted || friends === null || userRow === null) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  const rows: Row[] = [
    ...friends.map((f) => ({ ...f, isUser: false })),
    { ...userRow, isUser: true },
  ].sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-warn/30 bg-warn/[0.06] px-4 py-2.5 text-xs text-warn">
        ⚠ Demo data — the four “friends” are illustrative. Only the <strong>You</strong> row is real,
        computed live from your tracked bets. No accounts, no invites.
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-panel">
        <div className="grid grid-cols-12 gap-2 border-b border-edge px-4 py-2.5 text-[11px] uppercase tracking-wider text-white/40">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Player</div>
          <div className="col-span-2 text-right">Win %</div>
          <div className="col-span-2 text-right">Streak</div>
          <div className="col-span-2 text-right">P/L</div>
        </div>

        {rows.map((r, i) => (
          <div
            key={r.id}
            className={`grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm ${
              r.isUser ? "bg-brand/10 ring-1 ring-inset ring-brand/30" : i % 2 ? "bg-panel2/40" : ""
            }`}
          >
            <div className="col-span-1 font-mono text-white/50">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
            </div>
            <div className="col-span-5 flex items-center gap-2 truncate">
              <span className="text-lg">{r.avatar}</span>
              <span className={`truncate ${r.isUser ? "font-semibold text-white" : "text-white/80"}`}>
                {r.name}
              </span>
              {r.isUser && (
                <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">
                  you
                </span>
              )}
            </div>
            <div className="col-span-2 text-right font-mono text-white/70">{r.winRatePct}%</div>
            <div
              className={`col-span-2 text-right font-mono ${
                r.streak > 0 ? "text-good" : r.streak < 0 ? "text-bad" : "text-white/40"
              }`}
            >
              {streakLabel(r.streak)}
            </div>
            <div
              className={`col-span-2 text-right font-mono font-semibold ${
                r.pnl > 0 ? "text-good" : r.pnl < 0 ? "text-bad" : "text-white/60"
              }`}
            >
              {money(r.pnl)}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-white/35">
        Ranked by realized P/L. Track and grade bets in My Bets to climb the board.
      </p>
    </div>
  );
}
