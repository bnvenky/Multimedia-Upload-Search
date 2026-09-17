const MAX_TAG_LENGTH = 30;

/** "#Summer Trip!" -> "summer-trip" (same normalization as the API) */
export const normalizeTag = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, MAX_TAG_LENGTH);

/** Adds comma-separated input to an existing tag list, without duplicates. */
export const mergeTags = (existing, raw, maxTags = 15) => {
  const incoming = raw.split(',').map(normalizeTag).filter(Boolean);
  return [...new Set([...existing, ...incoming])].slice(0, maxTags);
};
