"use client";

import { useEffect, useState } from "react";

interface Snapshot {
  venue: string;
  impliedProb: number;
  rawPrice: string;
  fromCache: boolean;
}

interface HistoryCard {
  eventId: string;
  title: string;
  side: string;
  category: string;
  snapshot: Snapshot[];
  snapshotAt: string | null;
  context: string;
  sources: { title: string; url: string }[];
  isLive: boolean;
}

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; cards: HistoryCard[] };

function fmtDate(iso: string | null): string {
  if (!iso) return "no snapshot yet";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function Card({ card }: { card: HistoryCard }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel">
      <div className="flex items-start justify-between gap-3 border-b border-edge p-5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/40">{card.category}</div>
          <h3 className="mt-0.5 text-base font-semibold text-white">{card.title}</h3>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            card.isLive ? "bg-good/15 text-good" : "bg-edge text-white/50"
          }`}
        >
          {card.isLive ? "LIVE" : "CACHED"}
        </span>
      </div>

      {/* Snapshot */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-white/40">Last snapshot</span>
          <span className="text-[11px] text-white/35">{fmtDate(card.snapshotAt)}</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {card.snapshot.map((s) => (
            <div key={s.venue} className="rounded-lg border border-edge bg-panel2 p-2.5 text-center">
              <div className="text-[11px] text-white/45">{s.venue}</div>
              <div className="font-mono text-lg font-semibold text-white">{(s.impliedProb * 100).toFixed(1)}%</div>
              <div className="text-[10px] text-white/30">{s.rawPrice}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/65">{card.context}</p>

        {card.sources.length > 0 && (
          <ul className="mt-3 space-y-1">
            {card.sources.map((src, i) => (
              <li key={src.url + i} className="flex gap-2 text-sm">
                <span className="font-mono text-white/30">[{i + 1}]</span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand underline-offset-2 hover:underline"
                >
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.cards) setState({ status: "done", cards: d.cards });
        else setState({ status: "error" });
      })
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-bad/40 bg-bad/[0.06] p-6 text-sm text-bad">
        Couldn’t load historical context. The snapshots and Exa news call may be unavailable right now.
      </div>
    );
  }

  if (state.cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-edge bg-panel/50 p-12 text-center">
        <div className="text-4xl">🕘</div>
        <h3 className="mt-3 text-lg font-semibold text-white">No history yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">
          Run a scan first — snapshots are captured from cached prices, then enriched with recent news.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-edge bg-panel2/50 px-4 py-2.5 text-xs text-white/45">
        Shallow context for the 3 demo markets: last cached price snapshot + one recent Exa news pull each.
      </div>
      {state.cards.map((c) => (
        <Card key={c.eventId} card={c} />
      ))}
    </div>
  );
}
