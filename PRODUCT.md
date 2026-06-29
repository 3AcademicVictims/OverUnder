# Product

## Register

product

## Users

First-time viewers being shown the product: hackathon judges, recruiters, and
anyone Ray demos it to. They see it once, for a minute or two, and need to grasp
the concept (one market's implied probability across three venues, where they
disagree, and why) fast enough to walk away impressed. Secondary: people who
follow sports odds and find cross-venue price divergence genuinely interesting.

Their context: a live demo or a link opened cold, often on a laptop, sometimes a
phone. No onboarding, no second visit. The interface has to teach itself.

## Product Purpose

OverUnder is a read-only odds-divergence scanner. Pick a sports market, and it
shows the implied probability across Polymarket, Kalshi, and a sportsbook line,
highlights the best price, flags when the venues diverge by more than a few
points, and uses Exa + OpenAI to explain *why* they disagree with clickable
sources. It never places a trade; it only reads public market data.

Success = a first-time viewer types or picks a market, immediately understands
which venue is mispriced and by how much, trusts the number because they can see
where it came from, and thinks "that's clever."

## Brand Personality

Playful sports-fan energy, kept credible. Energetic, confident, a little bold
with color and motion, the way good sports broadcast graphics are. Three words:
**lively, sharp, trustworthy.** It should feel like it was made by someone who
loves both the game and the data, not by a casino and not by a committee.

The tension to hold: bring the excitement of sports without tipping into
childishness or hype. Energy comes from motion, confident typography, and decisive
use of the existing accent colors, not from emoji spam or fake urgency.

## Anti-references

- **Sketchy betting site**: no neon-on-black casino glow, no "BET NOW" pressure,
  no fake countdowns or garish multi-stop gradients. This is analysis, not a book.
- **Generic AI SaaS**: no cream background, no purple hero gradient, no endless
  identical icon-heading-text card grids, no template smell.
- **Cluttered data dump**: the one insight (best price + divergence) must never
  drown in chrome, secondary stats, or noise.
- **Childish / gimmicky**: no emoji-as-UI, no toy-like bounce, nothing that
  undercuts the credibility of the numbers.

## Design Principles

- **Impress in the first ten seconds.** The divergence insight is the hero and it
  should land before the viewer reads a label. Front-load the payoff.
- **Energy with a straight face.** Playful motion and bold accent color carry the
  sports-fan feeling; the data stays precise and the tone stays grown-up.
- **One insight, loud.** Best price and divergence dominate the hierarchy.
  Everything else (venue breakdown, research, sources) supports it, never competes.
- **Show the receipts.** Provenance tags (LIVE / CACHED / MOCK) and clickable
  sources turn a black-box number into something a skeptic can trust at a glance.
- **Read-only confidence.** It analyzes, it does not prompt action. Never nudge
  the viewer toward placing a bet.

## Accessibility & Inclusion

Target WCAG 2.1 AA (assumed default; not yet confirmed with the user). On the
existing dark theme, verify body text and the muted `text-white/40–50` tones hit
4.5:1 against `panel` / `ink`; several current uses are likely borderline.
Semantic state must never rely on the good/warn/bad hues alone (color-blind
safety) so pair them with text or icons. Every playful animation needs a
`prefers-reduced-motion: reduce` alternative (crossfade or instant).
