const {
  popularTagsQuerySchema,
  searchHitSchema,
  searchMetaSchema,
  searchQuerySchema,
  suggestionsQuerySchema,
  suggestionsResponseSchema,
  tagCountSchema,
} = require('../schemas/search.schema');
const { z } = require('../utils/zod');
const { bearerSecurity, errors, json, success } = require('./openapi.helpers');

function registerSearchDocs(registry) {
  registry.registerPath({
    method: 'get',
    path: '/search',
    tags: ['Search'],
    summary: 'Ranked, typo-tolerant keyword search',
    description: [
      'Example: `GET /search?query=beach video&type=video&sort=relevance`',
      '',
      '**Score** = `0.70 × relevance + 0.20 × popularity + 0.10 × freshness`',
      '- **relevance** — keyword matches weighted by field (tags 1.0 > title 0.85 > file name 0.65 > description 0.35) and match quality (exact 1.0, prefix 0.8, typo ≤ 0.55)',
      '- **popularity** — log-scaled view count',
      '- **freshness** — halves every 14 days',
      '',
      'Every hit includes its score breakdown and which words matched which fields.',
    ].join('\n'),
    security: bearerSecurity,
    request: { query: searchQuerySchema },
    responses: {
      200: json(success(z.object({ items: z.array(searchHitSchema) }), searchMetaSchema), 'Ranked results'),
      ...errors(400, 401),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/search/suggestions',
    tags: ['Search'],
    summary: 'Autocomplete suggestions (tags and titles)',
    security: bearerSecurity,
    request: { query: suggestionsQuerySchema },
    responses: { 200: json(success(suggestionsResponseSchema), 'Suggestions'), ...errors(400, 401) },
  });

  registry.registerPath({
    method: 'get',
    path: '/search/tags',
    tags: ['Search'],
    summary: 'Most used tags',
    security: bearerSecurity,
    request: { query: popularTagsQuerySchema },
    responses: { 200: json(success(z.object({ tags: z.array(tagCountSchema) })), 'Popular tags'), ...errors(400, 401) },
  });
}

module.exports = { registerSearchDocs };
