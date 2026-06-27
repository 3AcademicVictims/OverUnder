# OverUnder — Hackathon Work Split (3 people)

Three lanes that map onto the real files. The pipeline seams are clean, so once
the shared contract is locked, all three people work in parallel without
stepping on each other.

## The pipeline (so everyone shares one mental model)

```
query ──▶ parseAgent ──▶ eventId ──▶ synthesisAgent
                                        ├─▶ priceAgent    ──▶ 3 venue prices
                                        └─▶ researchAgent ──▶ summary + sources
                                        ──▶ ScanResult ──▶ /api/scan ──▶ <ResultCard>
```

Everything flows through two shared contracts:

- `backend/lib/types.ts` — the shapes between agents (`VenuePrice`, `Research`, `ScanResult`).
- `backend/data/events.ts` — the 3 demo events, their venue ID mappings, and the
  mocks every agent falls back to when an API fails.

---

## Hour 0 — contract first (do this BEFORE anyone splits off)

**Owner: Ron.** Nothing else starts until this is committed.

- [x] Lock `backend/lib/types.ts`. Freeze the `ScanResult` shape. This is the
      single source of truth Ray and Zavier both build against.
- [x] Fill in at least ONE event in `backend/data/events.ts` end to end:
      title, side, keywords, venue ID mappings, mock prices, mock research.
- [ ] Commit and push. Announce in the group chat: "contract is frozen."
      <!-- left for you: all code/data deliverables are done; git is yours to run -->

Why this matters: if the `ScanResult` shape changes after this point, Ray and
Zavier both eat merge pain. Freeze it early, change it only by group agreement.

---

## Zavier — external API integration

The hard, key-dependent lane. These are the only two files that touch the
outside world, need API keys, and carry the cache→mock fallback. Most
failure-prone, so it gets a full lane.

**Files:**
- `backend/agents/priceAgent.ts`
- `backend/agents/researchAgent.ts`
- `backend/skills/odds-normalisation.md`, `backend/skills/exa-research.md`

**Checklist:**
- [x] `priceAgent`: Polymarket Gamma (price IS the prob), Kalshi (yes-bid/ask
      midpoint), Odds API (de-vig across the field).
- [x] Each venue: live call → on any failure read cache → finally fall back to
      the mock in `events.ts`. The card must render with every API down.
- [x] `researchAgent`: Exa news search, best-effort tweets, OpenAI synthesis into
      a 2-sentence cited explanation. Same cache→mock fallback.
- [x] Tag every number `LIVE` / `CACHED` / `MOCK` via the `isLive` / `fromCache`
      flags so the UI can show provenance.

**Safety net:** Ron's mocks mean a broken API never blocks the demo. Build live,
lean on the mock.

---

## Ron — internal backend: glue, data, contracts

The spine. Owns the contracts the other two build against, the pure-logic
agents, and the HTTP wiring.

**Files:**
- `backend/data/events.ts` — events, venue ID mappings, all mocks
- `backend/lib/types.ts` — shared type contracts
- `backend/lib/cache.ts` — JSON cache helper
- `backend/agents/parseAgent.ts` — query → eventId
- `backend/agents/synthesisAgent.ts` — orchestration + best-price/divergence math
- `frontend/app/api/scan/route.ts`, `frontend/app/api/events/route.ts` — HTTP wiring

**Checklist:**
- [x] Hour-0 contract (above).
- [x] All 3 events fully populated in `events.ts` with real venue IDs + mocks.
- [x] `parseAgent`: keyword/token overlap scoring; gibberish returns nothing.
- [x] `synthesisAgent`: `bestVenue` = lowest implied prob; `divergencePts` =
      (max − min) × 100.
- [x] `/api/scan`: POST query → parse → synthesis → `ScanResult`; 404 with
      suggestions when no event matches.
- [x] `/api/events`: GET demo list for the quick-pick chips.

**Single-writer rule:** Ron owns `types.ts` and `events.ts`. Shared-read,
single-writer. Anyone needing a change asks Ron.

---

## Ray — frontend only

Never blocked on a working backend. Build the whole UI against a hardcoded
`ScanResult` fixture that matches the type, then flip to `/api/scan` once it
goes live.

**Files:**
- `frontend/app/page.tsx`, `layout.tsx`, `globals.css` — shell + theme
- `frontend/components/Scanner.tsx` — search box, quick-pick chips, states
- `frontend/components/ResultCard.tsx` — result rendering

**Checklist:**
- [x] `Scanner`: search box, popular chips, and all four states — idle, loading
      (skeleton), error (with suggestions), done.
- [x] `ResultCard`: 3 venue cards, best-price highlight, divergence badge (show
      when gap > 4 pts), research panel, clickable source links.
- [x] `LIVE` / `CACHED` / `MOCK` tag on each venue + the research panel.
- [x] Edge cases: long team names, zero sources, error state, mobile width.
- [x] Start against a fixture; swap to the live `/api/scan` call last.

---

## How it stays parallel

1. Ron locks the contract (Hour 0).
2. All three build at once: Ray against a fixture, Zavier against live APIs with
   mock fallback, Ron on parse/synthesis/routes.
3. Single integration join: the scan route (Ron) calling Zavier's agents.
4. Ray flips fixture → `/api/scan` when it's live.

**Effort balance:** Zavier ~330 lines but hardest (live API debugging eats
time). Ron ~400 but much is data + boilerplate. Ray ~300 but visual polish
burns time. Roughly even for a hackathon.
