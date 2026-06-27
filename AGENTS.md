# AGENTS.md — Odds Divergence Scanner

## What we're building
A read-only tool that takes a sports event, shows its implied probability across
three venues (Polymarket, Kalshi, a sportsbook reference line), highlights the
best price, flags divergence, and uses Exa to explain WHY the venues disagree
(fresh news + X chatter, with clickable sources).

## Hard constraints (2.5h hackathon — obey these)
- Next.js (App Router, TypeScript) + Tailwind. One page. No auth, no DB.
- Scope = 3 HARDCODED demo events in `data/events.ts` with pre-mapped venue IDs.
  Do NOT build cross-venue entity resolution. It's out of scope.
- Cache every external API response to `data/cache/*.json`. On any fetch failure,
  read from cache. The demo must render even if every API is down.
- Read-only. Never place a trade. We only read public market data.

## Pipeline (label these clearly in code — they are our "agents")
1. `parseAgent`  : query string -> { eventId } (simple fuzzy match to demo events)
2. `priceAgent`  : eventId -> normalized implied probs from 3 venues
3. `researchAgent`: eventId -> Exa news + tweets -> OpenAI sentiment synthesis w/ citations
4. `synthesisAgent`: combine prices + research -> result card payload

## Skills
- `skills/odds-normalization.md` : how to convert each venue's price to implied prob
- `skills/exa-research.md`       : how to query Exa for news+tweets and cite sources
Read the relevant skill before writing that step.

## Definition of done
Type "Lakers to beat Celtics" -> result card with 3 venue probabilities,
best price highlighted, divergence badge if gap > 4 points, and a sources panel
with 3-5 clickable links explaining the divergence.