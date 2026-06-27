"use client";

import { useEffect, useState } from "react";
import Scanner from "./Scanner";

type TabId = "scanner" | "bets" | "leaderboard" | "history";

const TABS: { id: TabId; label: string; icon: string; blurb: string }[] = [
  { id: "scanner", label: "Scanner", icon: "⚖️", blurb: "Compare odds across venues & see why they disagree" },
  { id: "bets", label: "My Bets", icon: "📈", blurb: "Track your bets, P/L and win rate" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆", blurb: "Compare with friends" },
  { id: "history", label: "History", icon: "🕘", blurb: "Historical context for the demo markets" },
];

const TAB_KEY = "overunder.tab";

function ComingNext({ tab }: { tab: { label: string; icon: string; blurb: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-edge bg-panel/50 p-12 text-center">
      <div className="text-4xl">{tab.icon}</div>
      <h3 className="mt-3 text-lg font-semibold text-white">{tab.label}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">{tab.blurb}.</p>
      <span className="mt-4 inline-block rounded-full border border-edge bg-panel2 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Coming next
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<TabId>("scanner");

  // Restore last tab after mount (avoids hydration mismatch).
  useEffect(() => {
    const saved = window.localStorage.getItem(TAB_KEY) as TabId | null;
    if (saved && TABS.some((t) => t.id === saved)) setTab(saved);
  }, []);

  function go(id: TabId) {
    setTab(id);
    try {
      window.localStorage.setItem(TAB_KEY, id);
    } catch {
      /* ignore */
    }
  }

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="border-b border-edge p-4 md:w-60 md:shrink-0 md:border-b-0 md:border-r md:py-8">
        <div className="flex items-center gap-2 px-2">
          <span className="text-2xl">⚖️</span>
          <div>
            <div className="text-base font-bold leading-tight tracking-tight text-white">OverUnder</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Odds dashboard</div>
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {TABS.map((t) => {
            const isActive = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isActive
                    ? "bg-brand/15 font-semibold text-white ring-1 ring-brand/40"
                    : "text-white/55 hover:bg-panel2 hover:text-white"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        <p className="mt-6 hidden px-2 text-[11px] leading-relaxed text-white/30 md:block">
          Read-only. We only read public market data — no trades are ever placed.
        </p>
      </aside>

      {/* Main */}
      <main className="flex-1 px-5 py-8 sm:px-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-white">{active.label}</h1>
          <p className="mt-1 text-sm text-white/50">{active.blurb}.</p>
        </header>

        {tab === "scanner" && <Scanner />}
        {tab === "bets" && <ComingNext tab={TABS[1]} />}
        {tab === "leaderboard" && <ComingNext tab={TABS[2]} />}
        {tab === "history" && <ComingNext tab={TABS[3]} />}
      </main>
    </div>
  );
}
