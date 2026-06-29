"use client";

import { useEffect, useState } from "react";
import type { ScanResult } from "@backend/lib/types";
import ResultCard from "./ResultCard";
import GlobePicker from "./GlobePicker";

interface EventChip {
  id: string;
  title: string;
  side: string;
}

type State =
  | { status: "idle" }
  | { status: "loading"; query: string }
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

function BackToGlobe({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-edge bg-panel/80 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:border-brand/60 hover:text-white"
    >
      <span aria-hidden>←</span> Back to globe
    </button>
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
    setState({ status: "loading", query: text });
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

  function reset() {
    setState({ status: "idle" });
  }

  const idle = state.status === "idle";

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden">
      {/* Globe backdrop — always mounted, dimmed when a panel is open. */}
      <div
        className={`absolute inset-0 transition-[filter,opacity,transform] duration-500 ease-out ${
          idle ? "" : "scale-[1.03] opacity-35 blur-[2px]"
        }`}
      >
        <GlobePicker events={chips} onPick={runScan} autoRotate={idle} />
      </div>

      {/* Top: slim search + hint (only on the globe home). */}
      {idle && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-sticky flex flex-col items-center gap-3 px-4 pt-20 sm:pt-7">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runScan(query);
            }}
            className="pointer-events-auto flex w-full max-w-xl gap-2"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden>
                ⌕
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any team — or tap a nation on the globe"
                aria-label="Search a market"
                className="w-full rounded-full border border-edge bg-panel/85 py-3 pl-11 pr-4 text-white placeholder:text-white/55 outline-none backdrop-blur transition focus:border-brand/60"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="rounded-full bg-brand px-6 py-3 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Scan
            </button>
          </form>
          <p className="rounded-full bg-ink/40 px-3 py-1 text-xs text-white/75 backdrop-blur">
            It&apos;s World Cup season — tap Spain, France or England to compare their title odds.
          </p>
        </div>
      )}

      {/* Loading overlay. */}
      {state.status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-overlay flex items-start justify-center overflow-y-auto px-4 py-20">
          <div className="pointer-events-auto w-full max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-edge bg-panel/80 px-4 py-2 text-sm text-white/80 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Scanning {state.query}…
            </div>
            <ResultSkeleton />
          </div>
        </div>
      )}

      {/* Error overlay. */}
      {state.status === "error" && (
        <div className="pointer-events-none absolute inset-0 z-overlay flex items-start justify-center overflow-y-auto px-4 py-20">
          <div className="pointer-events-auto w-full max-w-lg">
            <BackToGlobe onClick={reset} />
            <div className="rounded-2xl border border-bad/40 bg-panel p-6 shadow-panel">
              <div className="font-semibold text-bad">{state.message}</div>
              {state.suggestions && state.suggestions.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-white/65">Try one of the demo markets:</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {state.suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => runScan(s.title)}
                        className="rounded-full border border-edge bg-panel2 px-3 py-1 text-xs text-white/80 transition hover:border-brand/60 hover:text-white"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result overlay. */}
      {state.status === "done" && (
        <div className="pointer-events-none absolute inset-0 z-overlay flex items-start justify-center overflow-y-auto px-4 py-20">
          <div className="pointer-events-auto w-full max-w-3xl">
            <BackToGlobe onClick={reset} />
            <ResultCard result={state.result} />
          </div>
        </div>
      )}
    </section>
  );
}
