const { editDistance, normalizeText, stripExtension, tokenize } = require('./text-analysis');

/**
 * Ranking algorithm
 * -----------------
 *   score = 0.70 × relevance + 0.20 × popularity + 0.10 × freshness     (each between 0 and 1)
 *
 * relevance   How well the query matches the file. Each query word is looked up in every field
 *             with a field weight (tags 1.0 > title 0.85 > file name 0.65 > description 0.35)
 *             and a match quality (exact 1.0, prefix 0.8, typo/fuzzy up to 0.55).
 *             The best field counts fully and other matching fields add a small bonus.
 *             Scores are averaged over the query words, so files matching ALL words win,
 *             and an exact multi-word phrase in the title earns a bonus.
 * popularity  log(1 + views) / log(1 + 500) — more views help, with diminishing returns,
 *             so a viral file cannot bury a much better keyword match.
 * freshness   0.5 ^ (ageInDays / 14) — halves every 14 days.
 */
const RANKING_CONFIG = Object.freeze({
  weights: { relevance: 0.7, popularity: 0.2, freshness: 0.1 },
  fieldWeights: { tags: 1, title: 0.85, name: 0.65, description: 0.35 },
  matchStrength: { exact: 1, prefix: 0.8, fuzzyMax: 0.55 },
  additionalFieldBonus: 0.15,
  phraseBonus: 0.1,
  popularitySaturationViews: 500,
  freshnessHalfLifeDays: 14,
  minRelevance: 0.12,
});

const SEARCH_SORTS = ['relevance', 'newest', 'oldest', 'views', 'size', 'name'];

const DAY_MS = 24 * 60 * 60 * 1000;
const round = (value) => Math.round(value * 10_000) / 10_000;

/** Short words must match exactly; longer words tolerate 1–2 typos. */
function maxEditsFor(term) {
  if (term.length <= 3) return 0;
  if (term.length <= 6) return 1;
  return 2;
}

/** Best match of one query term against a field's tokens, or null. */
function bestMatch(term, tokens) {
  const { exact, prefix, fuzzyMax } = RANKING_CONFIG.matchStrength;
  const allowedEdits = maxEditsFor(term);
  let best = null;

  for (const token of tokens) {
    if (token === term) return { strength: exact, kind: 'exact', token };

    if (token.startsWith(term)) {
      if (!best || prefix > best.strength) best = { strength: prefix, kind: 'prefix', token };
      continue;
    }

    if (allowedEdits === 0) continue;

    // Also compare with the start of longer tokens, so "moutain" still matches "mountains".
    // Only for longer words that share the first letter — otherwise "park" would match "mark(eting)".
    const comparePrefix = token.length > term.length && term.length >= 5 && token[0] === term[0];
    const candidates = comparePrefix ? [token, token.slice(0, term.length)] : [token];
    for (const candidate of candidates) {
      const distance = editDistance(term, candidate, allowedEdits);
      if (distance > allowedEdits) continue;

      const strength = fuzzyMax * (1 - distance / Math.max(term.length, candidate.length));
      if (!best || strength > best.strength) best = { strength, kind: 'fuzzy', token };
    }
  }

  return best;
}

function computePopularity(views) {
  return Math.min(1, Math.log1p(Math.max(0, views)) / Math.log1p(RANKING_CONFIG.popularitySaturationViews));
}

function computeFreshness(createdAt, now = new Date()) {
  const ageDays = Math.max(0, now.getTime() - new Date(createdAt).getTime()) / DAY_MS;
  return Math.pow(0.5, ageDays / RANKING_CONFIG.freshnessHalfLifeDays);
}

/**
 * Scores one file against an analyzed query (see analyzeQuery) and explains why:
 * { total, relevance, popularity, freshness, matchedTerms, matches: [{ term, field, kind, token }] }
 */
function scoreDocument(document, query, now = new Date()) {
  const fields = {
    tags: (document.tags ?? []).flatMap((tag) => tokenize(tag)),
    title: tokenize(document.title),
    name: tokenize(stripExtension(document.originalName)),
    description: tokenize(document.description ?? ''),
  };

  const matches = [];
  const matchedTerms = [];
  let termScoreSum = 0;

  for (const term of query.terms) {
    const contributions = [];

    for (const [field, tokens] of Object.entries(fields)) {
      const match = bestMatch(term, tokens);
      if (!match) continue;
      contributions.push(RANKING_CONFIG.fieldWeights[field] * match.strength);
      matches.push({ term, field, kind: match.kind, token: match.token });
    }

    if (contributions.length === 0) continue;

    const best = Math.max(...contributions);
    const rest = contributions.reduce((sum, value) => sum + value, 0) - best;
    termScoreSum += Math.min(1, best + RANKING_CONFIG.additionalFieldBonus * rest);
    matchedTerms.push(term);
  }

  let relevance = query.terms.length > 0 ? termScoreSum / query.terms.length : 0;

  if (query.terms.length > 1 && relevance > 0) {
    const title = normalizeText(document.title).replace(/[^a-z0-9]+/g, ' ');
    if (title.includes(query.phrase)) relevance = Math.min(1, relevance + RANKING_CONFIG.phraseBonus);
  }

  const popularity = computePopularity(document.views ?? 0);
  const freshness = computeFreshness(document.createdAt, now);
  const { weights } = RANKING_CONFIG;
  const total =
    relevance === 0 ? 0 : weights.relevance * relevance + weights.popularity * popularity + weights.freshness * freshness;

  return {
    total: round(total),
    relevance: round(relevance),
    popularity: round(popularity),
    freshness: round(freshness),
    matchedTerms,
    matches,
  };
}

const time = (value) => new Date(value).getTime();

const comparators = {
  relevance: (a, b) => b.score.total - a.score.total,
  newest: (a, b) => time(b.document.createdAt) - time(a.document.createdAt),
  oldest: (a, b) => time(a.document.createdAt) - time(b.document.createdAt),
  views: (a, b) => b.document.views - a.document.views,
  size: (a, b) => (b.document.size ?? 0) - (a.document.size ?? 0),
  name: (a, b) => a.document.title.localeCompare(b.document.title, 'en', { sensitivity: 'base' }),
};

/**
 * Scores every document, drops the irrelevant ones and sorts the rest.
 * Ties fall back to score, then recency, then id, so the order is always stable.
 */
function rankDocuments(documents, query, { sort = 'relevance', now = new Date() } = {}) {
  return documents
    .map((document) => ({ document, score: scoreDocument(document, query, now) }))
    .filter((ranked) => ranked.score.relevance >= RANKING_CONFIG.minRelevance)
    .sort(
      (a, b) =>
        comparators[sort](a, b) ||
        b.score.total - a.score.total ||
        time(b.document.createdAt) - time(a.document.createdAt) ||
        String(a.document.id).localeCompare(String(b.document.id)),
    );
}

module.exports = {
  RANKING_CONFIG,
  SEARCH_SORTS,
  computePopularity,
  computeFreshness,
  scoreDocument,
  rankDocuments,
};
