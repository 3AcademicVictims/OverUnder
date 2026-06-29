"use client";

import { useState } from "react";
import type { ScanResult, VenuePrice } from "@backend/lib/types";
import { addBet } from "@/lib/bets";

const VENUE_ACCENT: Record<string, string> = {
  Polymarket: "text-brand",
  Kalshi: "text-good",
  Sportsbook: "text-warn",
};

function pct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

function SourceTag({ live, cache }: { live: boolean; cache: boolean }) {
  if (live) return <span className="rounded bg-good/15 px-1.5 py-0.5 text-[10px] font-medium text-good">LIVE</span>;
  if (cache) return <span className="rounded bg-warn/15 px-1.5 py-0.5 text-[10px] font-medium text-warn">CACHED</span>;
  return <span className="rounded bg-edge px-1.5 py-0.5 text-[10px] font-medium text-white/50">MOCK</span>;
}

function VenueRow({ price, isBest }: { price: VenuePrice; isBest: boolean }) {
  const width = Math.max(4, Math.min(100, price.impliedProb * 100));
  return (
    <div
      className={`relative rounded-xl border p-4 transition ${
        isBest ? "border-good/60 bg-good/[0.06]" : "border-edge bg-panel2"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className={`text-sm font-semibold ${VENUE_ACCENT[price.venue] ?? "text-white"}`}>
            {price.venue}
          </span>
          <SourceTag live={price.isLive} cache={price.fromCache} />
          {isBest && (
            <span className="rounded-full bg-good/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-good">
              Best price
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg font-semibold text-white">{pct(price.impliedProb)}</div>
          <div className="text-[11px] text-white/55">{price.rawPrice}</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-edge">
        <div
          className={`h-full rounded-full ${isBest ? "bg-good" : "bg-brand/70"}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <a
        href={price.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-[11px] text-white/65 underline-offset-2 hover:text-white hover:underline"
      >
        {price.label} ↗
      </a>
    </div>
  );
}

const SENTIMENT_STYLE: Record<string, string> = {
  bull: "bg-good/15 text-good",
  bear: "bg-bad/15 text-bad",
  mixed: "bg-warn/15 text-warn",
};

function TrackBet({ result }: { result: ScanResult }) {
  const [open, setOpen] = useState(false);
  const [venue, setVenue] = useState(result.bestVenue);
  const [stake, setStake] = useState(10);
  const [saved, setSaved] = useState(false);

  const selected = result.prices.find((p) => p.venue === venue) ?? result.prices[0];

  function save() {
    if (!selected || stake <= 0) return;
    addBet({
      eventId: result.eventId,
      eventTitle: result.title,
      side: result.side,
      venue: selected.venue,
      oddsAtBet: selected.impliedProb,
      rawPrice: selected.rawPrice,
      stake,
    });
    setSaved(true);
    setOpen(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="border-t border-edge p-5">
      {!open ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-white/65">
            {saved ? "Saved to My Bets ✓" : "Like this edge? Track it and grade it later."}
          </span>
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-brand/50 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20"
          >
            + Track this bet
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs text-white/50">
            Venue
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value as typeof venue)}
              className="mt-1 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
            >
              {result.prices.map((p) => (
                <option key={p.venue} value={p.venue}>
                  {p.venue} — {(p.impliedProb * 100).toFixed(1)}% ({p.rawPrice})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50 sm:w-32">
            Stake ($)
            <input
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
            >
              Save
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-edge px-4 py-2 text-sm text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultCard({ result }: { result: ScanResult }) {
  const diverges = result.divergencePts > 4;
  const research = result.research;

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-edge p-5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/55">{result.category}</div>
          <h2 className="mt-0.5 text-xl font-semibold text-white">{result.title}</h2>
          <div className="mt-1 text-sm text-white/50">
            Backing <span className="font-medium text-white/80">{result.side}</span>
          </div>
        </div>
        <div
          className={`flex flex-col items-end rounded-xl border px-4 py-2 ${
            diverges ? "border-bad/50 bg-bad/10" : "border-edge bg-panel2"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-white/40">Divergence</span>
          <span className={`font-mono text-2xl font-bold ${diverges ? "text-bad" : "text-white"}`}>
            {result.divergencePts.toFixed(1)}
            <span className="text-sm font-medium text-white/40"> pts</span>
          </span>
          <span className={`text-[10px] font-semibold ${diverges ? "text-bad" : "text-white/40"}`}>
            {diverges ? "⚑ Venues disagree" : "In line"}
          </span>
        </div>
      </div>

      {/* Venue prices */}
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {result.prices.map((p) => (
          <VenueRow key={p.venue} price={p} isBest={p.venue === result.bestVenue} />
        ))}
      </div>

      {/* Research / "why they disagree" */}
      <div className="border-t border-edge bg-panel2/40 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90">Why they disagree</h3>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SENTIMENT_STYLE[research.sentiment]}`}>
              {research.sentiment}
            </span>
            <SourceTag live={research.isLive} cache={research.fromCache} />
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{research.summary}</p>

        {research.sources.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wider text-white/55">Sources</div>
            <ul className="mt-2 space-y-1.5">
              {research.sources.map((s, i) => (
                <li key={s.url + i} className="flex gap-2 text-sm">
                  <span className="font-mono text-white/55">[{i + 1}]</span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand underline-offset-2 hover:underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Track this bet */}
      <TrackBet result={result} />
    </div>
  );
}
