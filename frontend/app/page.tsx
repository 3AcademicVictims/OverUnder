import Scanner from "@/components/Scanner";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <span className="text-lg font-bold tracking-tight text-white">OverUnder</span>
          <span className="rounded-full border border-edge bg-panel2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
            Odds Divergence Scanner
          </span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
          One market, three venues. See its implied probability on Polymarket, Kalshi and a sportsbook
          reference line, find the best price, and read a sourced explanation of why they disagree.
          Read-only — we never place a trade.
        </p>
      </header>

      <Scanner />

      <footer className="mt-12 border-t border-edge pt-5 text-xs text-white/30">
        Demo scope: 3 hardcoded markets · prices fall back to cache then mock when APIs are unavailable.
      </footer>
    </main>
  );
}
