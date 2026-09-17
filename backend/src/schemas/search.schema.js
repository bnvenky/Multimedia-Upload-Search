const { MEDIA_CATEGORIES } = require('../utils/media-types');
const { SEARCH_SORTS } = require('../utils/ranking');
const { z } = require('../utils/zod');
const { dateRangeIsValid, dateRangeIssue, fileFilterFields, paginationMetaSchema, SCOPES } = require('./common.schema');
const { fileResponseSchema } = require('./file.schema');

/* ------------------------------ Request schemas ------------------------------ */

const searchQuerySchema = z
  .object({
    query: z.string().trim().min(1).max(200).optional().openapi({ description: 'Search keywords', example: 'beach video' }),
    q: z.string().trim().min(1).max(200).optional().openapi({ description: 'Short alias of `query`' }),
    ...fileFilterFields,
    sort: z.enum(SEARCH_SORTS).default('relevance'),
  })
  .refine((value) => Boolean(value.query ?? value.q), { message: 'A search query is required', path: ['query'] })
  .refine(dateRangeIsValid, dateRangeIssue);

const suggestionsQuerySchema = z.object({
  q: z.string().trim().min(1).max(50).openapi({ example: 'bea' }),
  limit: z.coerce.number().int().min(1).max(10).default(6),
});

const popularTagsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(15),
  scope: z.enum(SCOPES).default('all'),
});

/* ------------------------------ Response schemas ----------------------------- */

const scoreSchema = z
  .object({
    total: z.number(),
    relevance: z.number(),
    popularity: z.number(),
    freshness: z.number(),
    matchedTerms: z.array(z.string()),
    matches: z.array(
      z.object({
        term: z.string(),
        field: z.enum(['tags', 'title', 'name', 'description']),
        kind: z.enum(['exact', 'prefix', 'fuzzy']),
        token: z.string(),
      }),
    ),
  })
  .openapi('ScoreBreakdown');

const searchHitSchema = fileResponseSchema.extend({ score: scoreSchema }).openapi('SearchHit');

const searchMetaSchema = paginationMetaSchema
  .extend({
    query: z.string(),
    terms: z.array(z.string()).openapi({ description: 'Normalized words used for matching' }),
    sort: z.string(),
    candidateLimitReached: z.boolean(),
    tookMs: z.number(),
  })
  .openapi('SearchMeta');

const tagCountSchema = z.object({ tag: z.string(), count: z.number() }).openapi('TagCount');

const suggestionsResponseSchema = z.object({
  tags: z.array(tagCountSchema),
  files: z.array(z.object({ id: z.string(), title: z.string(), category: z.enum(MEDIA_CATEGORIES) })),
});

module.exports = {
  searchQuerySchema,
  suggestionsQuerySchema,
  popularTagsQuerySchema,
  searchHitSchema,
  searchMetaSchema,
  tagCountSchema,
  suggestionsResponseSchema,
};
