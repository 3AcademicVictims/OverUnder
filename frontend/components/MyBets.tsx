"use client";

import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { getBets, onBetsChanged, removeBet, updateBet, type Bet } from "@/lib/bets";
import { betProfit, cumulativePnlSeries, summarize } from "@/lib/betStats";

function money(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "neutral" }) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-white";
  return (
    <div className="rounded-xl border border-edge bg-panel2 p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

const STATUS_STYLE: Record<Bet["status"], string> = {
  open: "bg-warn/15 text-warn",
  won: "bg-good/15 text-good",
  lost: "bg-bad/15 text-bad",
};

function BetRow({ bet }: { bet: Bet }) {
  const pnl = betProfit(bet);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-panel2 p-4">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{bet.side}</div>
        <div className="truncate text-xs text-white/45">{bet.eventTitle}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
          <span className={`rounded px-1.5 py-0.5 font-semibold uppercase ${STATUS_STYLE[bet.status]}`}>
            {bet.status}
          </span>
          <span>{bet.venue}</span>
          <span>·</span>
          <span>{(bet.oddsAtBet * 100).toFixed(1)}% @ ${bet.stake.toFixed(2)}</span>
          {bet.status !== "open" && (
            <>
              <span>·</span>
              <span className={pnl >= 0 ? "text-good" : "text-bad"}>{money(pnl)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {bet.status === "open" ? (
          <>
            <button
              onClick={() => updateBet(bet.id, { status: "won" })}
              className="rounded-lg border border-good/40 bg-good/10 px-3 py-1.5 text-xs font-semibold text-good hover:bg-good/20"
            >
              Won
            </button>
            <button
              onClick={() => updateBet(bet.id, { status: "lost" })}
              className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-1.5 text-xs font-semibold text-bad hover:bg-bad/20"
            >
              Lost
            </button>
          </>
        ) : (
          <button
            onClick={() => updateBet(bet.id, { status: "open" })}
            className="rounded-lg border border-edge px-3 py-1.5 text-xs text-white/55 hover:text-white"
          >
            Reopen
          </button>
        )}
        <button
          onClick={() => removeBet(bet.id)}
          className="rounded-lg border border-edge px-2.5 py-1.5 text-xs text-white/40 hover:border-bad/40 hover:text-bad"
          aria-label="Delete bet"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function MyBets() {
  const [mounted, setMounted] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);

  useEffect(() => {
    setMounted(true);
    const refresh = () => setBets(getBets());
    refresh();
    return onBetsChanged(refresh);
  }, []);

  // Loading (pre-mount: localStorage isn't available during SSR).
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-56 rounded-2xl" />
      </div>
    );
  }

  // Empty state.
  if (bets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-edge bg-panel/50 p-12 text-center">
        <div className="text-4xl">📈</div>
        <h3 className="mt-3 text-lg font-semibold text-white">No bets tracked yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">
          Head to the Scanner, find an edge, and hit <span className="font-medium text-white/80">“+ Track this
          bet.”</span> Your P/L, win rate and chart build up here — all stored locally in your browser.
        </p>
      </div>
    );
  }

  const s = summarize(bets);
  const series = cumulativePnlSeries(bets);
  const hasSettled = s.settled > 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Realized P/L"
          value={money(s.realizedPnl)}
          tone={s.realizedPnl > 0 ? "good" : s.realizedPnl < 0 ? "bad" : "neutral"}
        />
        <StatCard label="Win rate" value={hasSettled ? `${s.winRatePct.toFixed(0)}%` : "—"} />
        <StatCard label="Total staked" value={`$${s.totalStaked.toFixed(2)}`} />
        <StatCard label="Open / Settled" value={`${s.open} / ${s.settled}`} />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-edge bg-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90">Cumulative P/L</h3>
          <span className="text-[11px] text-white/40">{s.wins}W · {s.losses}L</span>
        </div>
        {hasSettled ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="#262838" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#8b8fa3", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#262838" }} />
                <YAxis tick={{ fill: "#8b8fa3", fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#13141d", border: "1px solid #262838", borderRadius: 12, color: "#e7e9f0" }}
                  formatter={(v: number) => [money(v), "Cumulative"]}
                />
                <ReferenceLine y={0} stroke="#3a3d52" />
                <Line type="monotone" dataKey="cumulative" stroke="#6d8bff" strokeWidth={2.5} dot={{ r: 3, fill: "#6d8bff" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center text-center text-sm text-white/40">
            Mark a bet <span className="mx-1 font-semibold text-good">Won</span> or
            <span className="mx-1 font-semibold text-bad">Lost</span> to start the curve.
          </div>
        )}
      </div>

      {/* Bet list */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-semibold text-white/90">Tracked bets ({bets.length})</h3>
        {bets.map((b) => (
          <BetRow key={b.id} bet={b} />
        ))}
      </div>
    </div>
  );
}
