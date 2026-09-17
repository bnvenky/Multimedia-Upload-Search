/**
 * Text analysis used both when a file is saved (indexing) and when a user searches (querying).
 * Using the exact same steps on both sides is what makes matching consistent.
 */

const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'by', 'for', 'from', 'in', 'is', 'of', 'on', 'or', 'the', 'to', 'with']);

const MAX_DOCUMENT_TOKENS = 120;
const MAX_DOCUMENT_TRIGRAMS = 800;
const MAX_DESCRIPTION_TOKENS = 40;
const MAX_QUERY_TERMS = 8;

/** "Café" -> "cafe": lowercase and strip accents. */
function normalizeText(input) {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function stripExtension(fileName) {
  return fileName.replace(/\.[a-z0-9]{1,5}$/i, '');
}

/** "summerTrip_2024" -> ["summer", "trip", "2024"] (splits punctuation, camelCase, letters/digits). */
function tokenize(input) {
  const separated = input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2');

  const tokens = normalizeText(separated)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 || /^\d$/.test(token));

  return [...new Set(tokens)];
}

/**
 * Padded 3-character chunks: "video" -> ["  v", " vi", "vid", "ide", "deo", "eo "].
 * Words with a typo still share most trigrams ("vidoe" vs "video"), which lets MongoDB find
 * fuzzy candidates using a normal index.
 */
function trigrams(token) {
  const padded = `  ${token} `;
  const grams = new Set();
  for (let index = 0; index <= padded.length - 3; index += 1) {
    grams.add(padded.slice(index, index + 3));
  }
  return [...grams];
}

/**
 * Number of edits (insert, delete, replace, swap two neighbours) to turn `a` into `b`.
 * "vidoe" -> "video" = 1. Stops early once the distance is larger than `maxDistance`.
 */
function editDistance(a, b, maxDistance = Number.POSITIVE_INFINITY) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const matrix = Array.from({ length: a.length + 1 }, (_, row) =>
    Array.from({ length: b.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)),
  );

  for (let i = 1; i <= a.length; i += 1) {
    let rowMin = Number.POSITIVE_INFINITY;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, matrix[i - 2][j - 2] + 1);
      }
      matrix[i][j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
  }

  return matrix[a.length][b.length];
}

/** Builds the search index stored on each file document. */
function buildSearchIndex({ title, originalName, tags, description }) {
  const primary = [
    ...tokenize(title),
    ...tokenize(stripExtension(originalName)),
    ...tags.flatMap((tag) => tokenize(tag)),
  ];
  const secondary = tokenize(description ?? '').slice(0, MAX_DESCRIPTION_TOKENS);
  const tokens = [...new Set([...primary, ...secondary])].slice(0, MAX_DOCUMENT_TOKENS);

  return {
    tokens,
    trigrams: [...new Set(tokens.flatMap((token) => trigrams(token)))].slice(0, MAX_DOCUMENT_TRIGRAMS),
  };
}

/** Turns the raw search text into terms and trigrams. Stop words are dropped unless nothing else is left. */
function analyzeQuery(query) {
  const allTerms = tokenize(query);
  const meaningful = allTerms.filter((term) => !STOP_WORDS.has(term));
  const terms = (meaningful.length > 0 ? meaningful : allTerms).slice(0, MAX_QUERY_TERMS);

  return {
    raw: query,
    phrase: normalizeText(query).replace(/[^a-z0-9]+/g, ' ').trim(),
    terms,
    trigrams: [...new Set(terms.flatMap((term) => trigrams(term)))],
  };
}

/** "#Summer Trip, travel" -> ["summer-trip", "travel"] */
function normalizeTags(input, maxTags = 15) {
  const raw = typeof input === 'string' ? input.split(',') : (input ?? []).flatMap((value) => value.split(','));
  const tags = raw
    .map((tag) =>
      normalizeText(tag)
        .trim()
        .replace(/^#+/, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30),
    )
    .filter(Boolean);
  return [...new Set(tags)].slice(0, maxTags);
}

/** Escapes user input before it is used inside a RegExp (prevents regex injection). */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  normalizeText,
  stripExtension,
  tokenize,
  trigrams,
  editDistance,
  buildSearchIndex,
  analyzeQuery,
  normalizeTags,
  escapeRegex,
};
