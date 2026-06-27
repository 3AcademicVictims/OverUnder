# OverUnder — Odds Divergence Scanner

A read-only tool that takes a sports market, shows its **implied probability across
three venues** (Polymarket, Kalshi, and a sportsbook reference line), highlights the
**best price**, flags **divergence**, and uses **Exa + OpenAI** to explain *why* the
venues disagree — with clickable sources.

> Read-only. We only read public market data. No trades are ever placed.

## Repository layout

```
OverUnder/
├── AGENTS.md              # product brief + hard constraints
├── README.md
├── frontend/              # Next.js (App Router, TS, Tailwind) — the UI
│   ├── app/
│   │   ├── page.tsx              # the Scanner page
│   │   └── api/
│   │       ├── scan/route.ts     # POST → runs the backend pipeline
│   │       └── events/route.ts   # GET  → demo market list (quick-picks)
│   └── components/        # Scanner, ResultCard
└── backend/               # all API logic — the "agents"
    ├── agents/
    │   ├── parseAgent.ts        # query string → eventId (fuzzy match)
    │   ├── priceAgent.ts        # eventId → normalized implied probs (3 venues)
    │   ├── researchAgent.ts     # eventId → Exa news+tweets → OpenAI synthesis
    │   └── synthesisAgent.ts    # prices + research → result-card payload
    ├── data/
    │   ├── events.ts            # 3 HARDCODED demo events w/ pre-mapped venue IDs
    │   └── cache/               # cached API responses (git-ignored)
    ├── lib/                # types + tiny JSON cache helper
    └── skills/            # how-to notes for odds normalization & Exa research
```

The frontend imports backend modules via the `@backend/*` path alias
(`frontend/tsconfig.json`) with `experimental.externalDir` enabled in
`next.config.mjs`. The API routes are thin — all logic lives in `backend/agents`.

## The pipeline (our "agents")

1. **parseAgent** — `query → { eventId }`. Simple fuzzy match to the demo events.
2. **priceAgent** — `eventId → implied probs` from Polymarket, Kalshi, sportsbook.
   - Polymarket / Kalshi: price *is* the probability (no vig).
   - Sportsbook (The Odds API): de-vigged across the field.
3. **researchAgent** — `eventId → Exa news + tweets → OpenAI synthesis` with citations.
4. **synthesisAgent** — combines prices + research, computes best price + divergence.

## Resilience: cache → mock fallback

Every successful external API response is written to `backend/data/cache/*.json`.
On **any** failure (missing key, network error, bad payload) an agent falls back
to the last cached value, and finally to the **mock** baked into `data/events.ts`.
**The demo renders even with every API down and no keys present.**

A venue/research panel is tagged so you can see where each number came from:
`LIVE` (fresh API call) · `CACHED` (served from disk) · `MOCK` (hardcoded fallback).

## Demo markets

Pre-picked for the 2026 FIFA World Cup (in progress Jun–Jul 2026), whose winner
futures overlap across Polymarket, Kalshi and the sportsbook line:

- Spain to win the 2026 FIFA World Cup
- France to win the 2026 FIFA World Cup
- England to win the 2026 FIFA World Cup

## Getting started

```bash
cd frontend
npm install
cp .env.local.example .env.local   # optional — fill in keys for LIVE data
npm run dev                         # http://localhost:3000
```

### Keys (all optional)

Put these in `frontend/.env.local`:

| Key              | Used by        | Without it           |
| ---------------- | -------------- | -------------------- |
| `ODDS_API_KEY`   | priceAgent     | sportsbook → cache/mock |
| `EXA_API_KEY`    | researchAgent  | research → cache/mock   |
| `OPENAI_API_KEY` | researchAgent  | shows raw Exa summary instead of synthesis |

(Polymarket Gamma and Kalshi are public and need no key.)

## Definition of done

Type "Spain to win the World Cup" → a result card with 3 venue probabilities, the
best price highlighted, a divergence badge when the gap exceeds 4 points, and a
sources panel of clickable links explaining the divergence.
