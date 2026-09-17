const { MEDIA_CATEGORIES } = require('../utils/media-types');
const { normalizeTags } = require('../utils/text-analysis');
const { z } = require('../utils/zod');

const SCOPES = ['all', 'mine'];
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Accepts "a,b,c" or ["a", "b"] and returns clean, lowercase tags. */
const tagsInput = z
  .union([z.array(z.string().max(60)).max(30), z.string().max(1000)])
  .transform((value) => normalizeTags(value))
  .openapi({ type: 'string', description: 'Comma-separated tags (max 15)', example: 'travel,beach,summer' });

/** "image,video" -> ["image", "video"] (only valid media types allowed). */
const mediaTypeList = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    (Array.isArray(value) ? value : value.split(','))
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(z.array(z.enum(MEDIA_CATEGORIES)).max(MEDIA_CATEGORIES.length))
  .openapi({ type: 'string', description: 'Comma-separated media types', example: 'image,video' });

const startDate = z.coerce.date().openapi({ type: 'string', format: 'date', example: '2025-01-01' });

/** A date-only value like "2025-12-31" includes the whole day. */
const endDate = z
  .string()
  .transform((value) => (DATE_ONLY.test(value) ? `${value}T23:59:59.999Z` : value))
  .pipe(z.coerce.date())
  .openapi({ type: 'string', format: 'date', description: 'Inclusive end date', example: '2025-12-31' });

const paginationFields = {
  page: z.coerce.number().int().min(1).max(500).default(1).openapi({ example: 1 }),
  limit: z.coerce.number().int().min(1).max(50).default(20).openapi({ example: 20 }),
};

/** Filters shared by browsing (GET /files) and searching (GET /search). */
const fileFilterFields = {
  type: mediaTypeList.optional(),
  tags: tagsInput.optional().openapi({ description: 'Only files that have ALL of these tags' }),
  from: startDate.optional(),
  to: endDate.optional(),
  scope: z.enum(SCOPES).default('all').openapi({ description: '`mine` = only your own uploads' }),
  ...paginationFields,
};

const dateRangeIsValid = (query) => !query.from || !query.to || query.from <= query.to;
const dateRangeIssue = { message: '"from" must be on or before "to"', path: ['from'] };

const paginationMetaSchema = z
  .object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  })
  .openapi('PaginationMeta');

module.exports = {
  SCOPES,
  tagsInput,
  fileFilterFields,
  dateRangeIsValid,
  dateRangeIssue,
  paginationMetaSchema,
};
