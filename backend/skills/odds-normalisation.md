# Skill: Odds Normalization

Goal: convert each venue's raw price into a comparable implied probability (0-1).

## Prediction markets (Polymarket, Kalshi) — price IS the probability
- Polymarket Gamma: GET https://gamma-api.polymarket.com/markets?id=<id>
  Use `outcomePrices` (string array). YES price ~= implied prob directly. No vig.
- Kalshi: GET https://api.elections.kalshi.com/trade-api/v2/markets/<ticker>
  Use midpoint of `yes_bid`/`yes_ask`, divide by 100 (cents -> prob). No vig.

## Sportsbook (The Odds API) — must de-vig
- GET https://api.the-odds-api.com/v4/sports/<sport>/odds/?regions=us&markets=h2h&apiKey=<KEY>
- raw_implied = 1 / decimal_odds  (convert American odds to decimal first if needed)
- overround = raw_implied_A + raw_implied_B
- fair_prob_A = raw_implied_A / overround   # strip the vig so two sides sum to 1

Return per venue: { venue, impliedProb, rawPrice, sourceUrl }.
Best price = highest payout for the chosen side (lowest implied prob to back YES).
Divergence = max(impliedProb) - min(impliedProb) across venues.