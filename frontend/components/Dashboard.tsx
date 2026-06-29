"use client";

import { useEffect, useState } from "react";
import Scanner from "./Scanner";

type TabId = "scanner" | "bets" | "leaderboard" | "history";

const TABS: { id: TabId; label: string; icon: string; blurb: string }[] = [
  { id: "scanner", label: "Scanner", icon: "⚖", blurb: "Compare odds across venues and see why they disagree" },
  { id: "bets", label: "My Bets", icon: "▲", blurb: "Track your bets, P/L and win rate" },
  { id: "leaderboard", label: "Leaderboard", icon: "★", blurb: "Compare with friends" },
  { id: "history", label: "History", icon: "◷", blurb: "Historical context for the demo markets" },
];

const TAB_KEY = "overunder.tab";

function ComingNext({ tab }: { tab: { label: string; icon: string; blurb: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-edge bg-panel/50 p-12 text-center">
      <div className="text-4xl text-brand">{tab.icon}</div>
      <h3 className="mt-3 text-lg font-semibold text-white">{tab.label}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-white/65">{tab.blurb}.</p>
      <span className="mt-4 inline-block rounded-full border border-edge bg-panel2 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/55">
        Coming next
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<TabId>("scanner");
  const [navOpen, setNavOpen] = useState(false);

  // Restore last tab after mount (avoids hydration mismatch).
  useEffect(() => {
    const saved = window.localStorage.getItem(TAB_KEY) as TabId | null;
    if (saved && TABS.some((t) => t.id === saved)) setTab(saved);
  }, []);

  // Close the drawer with Escape.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  function go(id: TabId) {
    setTab(id);
    setNavOpen(false);
    try {
      window.localStorage.setItem(TAB_KEY, id);
    } catch {
      /* ignore */
    }
  }

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="relative min-h-screen w-full">
      {/* Floating controls: menu toggle + wordmark. Always available. */}
      <div className="fixed left-4 top-4 z-sticky flex items-center gap-3">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={navOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-panel/80 text-white backdrop-blur transition hover:border-brand/60"
        >
          <span className="flex flex-col gap-[3px]" aria-hidden>
            <span className="h-0.5 w-4 rounded bg-current" />
            <span className="h-0.5 w-4 rounded bg-current" />
            <span className="h-0.5 w-4 rounded bg-current" />
          </span>
        </button>
        <div className="flex items-center gap-2 rounded-full border border-edge bg-panel/80 px-3 py-1.5 backdrop-blur">
          <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_10px_2px_rgba(109,139,255,0.6)]" />
          <span className="text-sm font-bold tracking-tight text-white">OverUnder</span>
        </div>
      </div>

      {/* Backdrop */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-backdrop bg-ink/60 backdrop-blur-sm"
          aria-hidden
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed left-0 top-0 z-drawer flex h-full w-72 flex-col border-r border-edge bg-panel px-4 py-6 transition-transform duration-300 ease-out ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!navOpen}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_10px_2px_rgba(109,139,255,0.6)]" />
            <div>
              <div className="text-base font-bold leading-tight tracking-tight text-white">OverUnder</div>
              <div className="text-[10px] uppercase tracking-wider text-white/55">Odds dashboard</div>
            </div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-panel2 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {TABS.map((t) => {
            const isActive = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isActive
                    ? "bg-brand/15 font-semibold text-white ring-1 ring-brand/40"
                    : "text-white/70 hover:bg-panel2 hover:text-white"
                }`}
              >
                <span className={`w-4 text-center ${isActive ? "text-brand" : "text-white/55"}`} aria-hidden>
                  {t.icon}
                </span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        <p className="mt-auto px-2 text-[11px] leading-relaxed text-white/45">
          Read-only. We only read public market data — no trades are ever placed.
        </p>
      </aside>

      {/* Content */}
      {tab === "scanner" ? (
        <Scanner />
      ) : (
        <main className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-white">{active.label}</h1>
            <p className="mt-1 text-sm text-white/65">{active.blurb}.</p>
          </header>
          {tab === "bets" && <ComingNext tab={TABS[1]} />}
          {tab === "leaderboard" && <ComingNext tab={TABS[2]} />}
          {tab === "history" && <ComingNext tab={TABS[3]} />}
        </main>
      )}
    </div>
  );
}
