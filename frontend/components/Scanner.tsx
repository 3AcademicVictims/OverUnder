"use client";

import { useEffect, useState } from "react";
import type { ScanResult } from "@backend/lib/types";
import ResultCard from "./ResultCard";

interface EventChip {
  id: string;
  title: string;
  side: string;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; suggestions?: { id: string; title: string }[] }
  | { status: "done"; result: ScanResult };

function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel">
      <div className="border-b border-edge p-5">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton mt-2 h-6 w-72 rounded" />
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-edge bg-panel2 p-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton mt-3 h-6 w-16 rounded" />
            <div className="skeleton mt-3 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="border-t border-edge p-5">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton mt-3 h-3 w-full rounded" />
        <div className="skeleton mt-2 h-3 w-5/6 rounded" />
      </div>
    </div>
  );
}

export default function Scanner() {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<EventChip[]>([]);
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setChips(d.events ?? []))
      .catch(() => setChips([]));
  }, []);

  async function runScan(q: string) {
    const text = q.trim();
    if (!text) return;
    setQuery(text);
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Scan failed.", suggestions: data.suggestions });
        return;
      }
      setState({ status: "done", result: data.result });
    } catch {
      setState({ status: "error", message: "Network error — could not reach the scanner." });
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runScan(query);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "Spain to win the World Cup" or "England champion"'
            className="w-full rounded-xl border border-edge bg-panel py-3 pl-10 pr-4 text-white placeholder:text-white/30 outline-none transition focus:border-brand/60"
          />
        </div>
        <button
          type="submit"
          disabled={state.status === "loading" || !query.trim()}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.status === "loading" ? "Scanning…" : "Scan"}
        </button>
      </form>

      {/* Popular quick-picks */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40">Popular:</span>
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => runScan(c.side)}
              className="rounded-full border border-edge bg-panel2 px-3 py-1 text-xs text-white/70 transition hover:border-brand/60 hover:text-white"
            >
              {c.side}
            </button>
          ))}
        </div>
      )}

      {/* States */}
      {state.status === "idle" && (
        <div className="rounded-2xl border border-dashed border-edge bg-panel/50 p-10 text-center">
          <div className="text-3xl">⚖️</div>
          <h3 className="mt-3 text-lg font-semibold text-white">Scan a market</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
            Pick a popular market above, or type a team. You&apos;ll get its implied probability across
            Polymarket, Kalshi and a sportsbook line — with the best price highlighted and a sourced take on
            why they disagree.
          </p>
        </div>
      )}

      {state.status === "loading" && <ResultSkeleton />}

      {state.status === "error" && (
        <div className="rounded-2xl border border-bad/40 bg-bad/[0.06] p-6">
          <div className="font-semibold text-bad">{state.message}</div>
          {state.suggestions && state.suggestions.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-white/50">Try one of the demo markets:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => runScan(s.title)}
                    className="rounded-full border border-edge bg-panel2 px-3 py-1 text-xs text-white/70 hover:border-brand/60 hover:text-white"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {state.status === "done" && <ResultCard result={state.result} />}
    </div>
  );
}
