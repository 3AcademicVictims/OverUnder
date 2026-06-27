// data/events.ts
//
// SCOPE (see AGENTS.md): 3 HARDCODED demo events with pre-mapped venue IDs.
// We do NOT do cross-venue entity resolution — every venue identifier below is
// hand-mapped to the same real-world outcome.
//
// Pre-picked for 2026-06-27: the 2026 FIFA World Cup (USA/CAN/MEX, Jun–Jul 2026)
// is in progress, and its "winner" futures are listed on BOTH Polymarket and
// Kalshi (plus a sportsbook reference line via The Odds API). Championship
// futures overlap most reliably across venues, per the build brief.
//
// Each event carries `mock` values so the UI renders a full result card before
// the live agents (priceAgent / researchAgent) are wired in.

export type VenueName = "Polymarket" | "Kalshi" | "Sportsbook";

export interface VenueRef {
  venue: VenueName;
  /** Human label for the source link. */
  label: string;
  /** Clickable URL to the venue's market page. */
  sourceUrl: string;

  // ---- live-fetch identifiers (consumed by priceAgent) ----
  /** Polymarket Gamma market id (numeric string). */
  polymarketId?: string;
  /** Kalshi market ticker. */
  kalshiTicker?: string;
  /** The Odds API sport key, e.g. "soccer_fifa_world_cup_winner". */
  oddsApiSport?: string;
  /**
   * Outcome name to match inside The Odds API h2h/outrights response,
   * and the opposing label used to de-vig (for 2-way h2h). For an outright
   * (futures) market we de-vig across the whole field instead.
   */
  oddsApiOutcome?: string;

  // ---- mock fallback (used by the skeleton + as last-resort) ----
  mockImpliedProb: number; // 0..1
  mockRawPrice: string; // human-readable raw price for the venue
}

export interface MockSource {
  title: string;
  url: string;
}

export interface DemoEvent {
  id: string;
  /** Full headline shown on the card. */
  title: string;
  /** The side/outcome we are pricing (the "YES"). */
  side: string;
  /** Grouping label, e.g. tournament. */
  category: string;
  /** Tokens used by parseAgent's fuzzy match. */
  keywords: string[];
  venues: VenueRef[];
  /** Mock research payload so the skeleton renders a full sources panel. */
  mockResearch: {
    summary: string;
    sentiment: "bull" | "bear" | "mixed";
    sources: MockSource[];
  };
}

export const EVENTS: DemoEvent[] = [
  {
    id: "wc2026-spain",
    title: "Spain to win the 2026 FIFA World Cup",
    side: "Spain",
    category: "2026 FIFA World Cup — Winner",
    keywords: ["spain", "espana", "world cup", "wc", "winner", "champion", "la roja"],
    venues: [
      {
        venue: "Polymarket",
        label: "Polymarket — Spain to win 2026 World Cup",
        sourceUrl: "https://polymarket.com/event/world-cup-winner",
        polymarketId: "558934",
        mockImpliedProb: 0.124,
        mockRawPrice: "$0.12",
      },
      {
        venue: "Kalshi",
        label: "Kalshi — KXMENWORLDCUP Spain",
        sourceUrl: "https://kalshi.com/markets/kxmenworldcup",
        kalshiTicker: "KXMENWORLDCUP-26-ES",
        mockImpliedProb: 0.119,
        mockRawPrice: "11.9¢ (yes mid)",
      },
      {
        venue: "Sportsbook",
        label: "The Odds API — FIFA World Cup winner (de-vigged)",
        sourceUrl: "https://the-odds-api.com",
        oddsApiSport: "soccer_fifa_world_cup_winner",
        oddsApiOutcome: "Spain",
        mockImpliedProb: 0.19,
        mockRawPrice: "+420 (≈4.2 dec)",
      },
    ],
    mockResearch: {
      summary:
        "Spain enters the knockout rounds as one of the form favorites after topping its group, and a clean injury sheet has the sportsbook line drifting shorter than the prediction markets. Polymarket and Kalshi lag the book, leaving the back-Spain price slightly cheaper on the books.",
      sentiment: "bull",
      sources: [
        { title: "Spain top group with perfect record — match report", url: "https://example.com/spain-group-stage" },
        { title: "La Roja injury update: key midfielder fit for knockouts", url: "https://example.com/spain-injury" },
        { title: "Tournament futures: where the sharp money is going", url: "https://example.com/wc-futures-movement" },
      ],
    },
  },
  {
    id: "wc2026-france",
    title: "France to win the 2026 FIFA World Cup",
    side: "France",
    category: "2026 FIFA World Cup — Winner",
    keywords: ["france", "les bleus", "world cup", "wc", "winner", "champion", "mbappe"],
    venues: [
      {
        venue: "Polymarket",
        label: "Polymarket — France to win 2026 World Cup",
        sourceUrl: "https://polymarket.com/event/world-cup-winner",
        polymarketId: "558936",
        mockImpliedProb: 0.215,
        mockRawPrice: "$0.22",
      },
      {
        venue: "Kalshi",
        label: "Kalshi — KXMENWORLDCUP France",
        sourceUrl: "https://kalshi.com/markets/kxmenworldcup",
        kalshiTicker: "KXMENWORLDCUP-26-FR",
        mockImpliedProb: 0.205,
        mockRawPrice: "20.5¢ (yes mid)",
      },
      {
        venue: "Sportsbook",
        label: "The Odds API — FIFA World Cup winner (de-vigged)",
        sourceUrl: "https://the-odds-api.com",
        oddsApiSport: "soccer_fifa_world_cup_winner",
        oddsApiOutcome: "France",
        mockImpliedProb: 0.205,
        mockRawPrice: "+390 (≈4.9 dec)",
      },
    ],
    mockResearch: {
      summary:
        "France remain the bookmakers' co-favorite on depth alone, but a fresh injury scare to a starting forward has prediction-market traders shading the price down faster than the book. The result is a modest gap: Kalshi prices France cheaper than the sportsbook reference.",
      sentiment: "mixed",
      sources: [
        { title: "France forward limps off in training — fitness in doubt", url: "https://example.com/france-injury" },
        { title: "Les Bleus squad depth keeps them among favorites", url: "https://example.com/france-depth" },
        { title: "X reacts to France knockout draw", url: "https://example.com/france-x-reaction" },
      ],
    },
  },
  {
    id: "wc2026-england",
    title: "England to win the 2026 FIFA World Cup",
    side: "England",
    category: "2026 FIFA World Cup — Winner",
    keywords: ["england", "three lions", "world cup", "wc", "winner", "champion", "kane"],
    venues: [
      {
        venue: "Polymarket",
        label: "Polymarket — England to win 2026 World Cup",
        sourceUrl: "https://polymarket.com/event/world-cup-winner",
        polymarketId: "558935",
        mockImpliedProb: 0.103,
        mockRawPrice: "$0.10",
      },
      {
        venue: "Kalshi",
        label: "Kalshi — KXMENWORLDCUP England",
        sourceUrl: "https://kalshi.com/markets/kxmenworldcup",
        kalshiTicker: "KXMENWORLDCUP-26-GB",
        mockImpliedProb: 0.103,
        mockRawPrice: "10.3¢ (yes mid)",
      },
      {
        venue: "Sportsbook",
        label: "The Odds API — FIFA World Cup winner (de-vigged)",
        oddsApiSport: "soccer_fifa_world_cup_winner",
        sourceUrl: "https://the-odds-api.com",
        oddsApiOutcome: "England",
        mockImpliedProb: 0.12,
        mockRawPrice: "+650 (≈7.5 dec)",
      },
    ],
    mockResearch: {
      summary:
        "England's draw opened up after two seeded teams were eliminated, and the sportsbook cut its price sharply on the easier path. Polymarket and Kalshi have been slower to react, so backing England is currently a touch cheaper on the book than on the prediction markets.",
      sentiment: "bull",
      sources: [
        { title: "England's path to the final eases after upsets", url: "https://example.com/england-draw" },
        { title: "Captain returns to full training ahead of quarterfinal", url: "https://example.com/england-captain" },
        { title: "Futures desk: England backed into shorter odds", url: "https://example.com/england-odds-cut" },
      ],
    },
  },
];

export function getEventById(id: string): DemoEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}
