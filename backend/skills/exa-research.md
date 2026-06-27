# Skill: Exa Research (the differentiator)

Goal: explain WHY venues disagree using fresh web + X signal, with citations.

## News (reliable — primary)
POST https://api.exa.ai/search   (header: x-api-key: <EXA_KEY>)
{
  "query": "<team A> vs <team B> injury news lineup form",
  "category": "news",
  "numResults": 5,
  "startPublishedDate": "<7 days ago ISO>",
  "contents": { "highlights": true, "summary": true }
}

## Tweets (best-effort — secondary panel)
Same endpoint, { "category": "tweet", "numResults": 5, "type": "auto" }.
Keywords go in `query` only — do NOT use includeText/excludeText (400 errors).

## Synthesis
Pass the news+tweet results to OpenAI with: "Given these sources and that
Polymarket implies X% vs the book's Y%, explain in 2 sentences why the market
may be pricing this differently. Cite each claim with its source URL."
Return { summary, sentiment: bull|bear|mixed, sources: [{title, url}] }.
Every claim in the UI must link to its source.