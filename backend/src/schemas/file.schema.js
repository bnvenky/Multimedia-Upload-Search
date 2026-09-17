const { VISIBILITIES } = require('../models/media-file.model');
const { MEDIA_CATEGORIES } = require('../utils/media-types');
const { objectIdSchema, z } = require('../utils/zod');
const { dateRangeIsValid, dateRangeIssue, fileFilterFields, tagsInput } = require('./common.schema');

const BROWSE_SORTS = ['newest', 'oldest', 'views', 'size', 'name', 'trending'];

/* ------------------------------ Request schemas ------------------------------ */

const fileIdParamsSchema = z.object({ id: objectIdSchema });

const listFilesQuerySchema = z
  .object({
    ...fileFilterFields,
    sort: z.enum(BROWSE_SORTS).default('newest'),
  })
  .refine(dateRangeIsValid, dateRangeIssue);

/** Text fields sent together with the file in multipart/form-data. */
const uploadFileBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(120)
      .optional()
      .openapi({ description: 'Defaults to a title made from the file name', example: 'Sunset at the beach' }),
    description: z.string().trim().max(1000).default('').openapi({ example: 'Golden hour in Goa' }),
    tags: tagsInput.default([]),
    visibility: z
      .enum(VISIBILITIES)
      .default('public')
      .openapi({ description: '`public` (default) = visible to every signed-in user · `private` = only you' }),
  })
  .strict();

const updateFileBodySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    tags: tagsInput.optional(),
    visibility: z.enum(VISIBILITIES).optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), 'Provide at least one field to update')
  .openapi('UpdateFileRequest');

/** Only used for Swagger: documents the multipart upload form. */
const uploadFileFormSchema = z
  .object({
    file: z.string().openapi({ type: 'string', format: 'binary' }),
    title: z.string().max(120).optional(),
    description: z.string().max(1000).optional(),
    tags: z.string().optional().openapi({ description: 'Comma-separated tags', example: 'travel,beach' }),
    visibility: z.enum(VISIBILITIES).optional(),
  })
  .openapi('UploadFileRequest');

/* ------------------------------ Response schemas ----------------------------- */

const fileResponseSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    originalName: z.string(),
    mimeType: z.string().openapi({ example: 'video/mp4' }),
    extension: z.string().openapi({ example: 'mp4' }),
    category: z.enum(MEDIA_CATEGORIES),
    size: z.number().openapi({ description: 'Size in bytes' }),
    visibility: z.enum(VISIBILITIES),
    url: z.string().openapi({ description: 'Cloudinary HTTPS delivery URL' }),
    thumbnailUrl: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    duration: z.number().nullable().openapi({ description: 'Seconds (audio / video)' }),
    pages: z.number().nullable(),
    views: z.number(),
    lastViewedAt: z.string().nullable().openapi({ format: 'date-time' }),
    owner: z.object({ id: z.string(), name: z.string() }),
    createdAt: z.string().openapi({ format: 'date-time' }),
    updatedAt: z.string().openapi({ format: 'date-time' }),
    previewPages: z
      .array(z.string())
      .optional()
      .openapi({ description: 'Details only: one rendered image per PDF page (empty for other types)' }),
  })
  .openapi('MediaFile');

const downloadUrlResponseSchema = z
  .object({
    url: z.string().openapi({ description: 'Link to the original file' }),
    expiresAt: z.string().nullable().openapi({ format: 'date-time', description: 'When a signed link stops working' }),
  })
  .openapi('DownloadUrl');

const fileStatsSchema = z
  .object({
    totalFiles: z.number(),
    totalBytes: z.number(),
    totalViews: z.number(),
    byCategory: z.record(z.enum(MEDIA_CATEGORIES), z.object({ count: z.number(), bytes: z.number() })),
  })
  .openapi('FileStats');

module.exports = {
  BROWSE_SORTS,
  fileIdParamsSchema,
  listFilesQuerySchema,
  uploadFileBodySchema,
  updateFileBodySchema,
  uploadFileFormSchema,
  fileResponseSchema,
  fileStatsSchema,
  downloadUrlResponseSchema,
};
