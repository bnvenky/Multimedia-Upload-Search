const { paginationMetaSchema } = require('../schemas/common.schema');
const {
  downloadUrlResponseSchema,
  fileIdParamsSchema,
  fileResponseSchema,
  fileStatsSchema,
  listFilesQuerySchema,
  updateFileBodySchema,
  uploadFileFormSchema,
} = require('../schemas/file.schema');
const { MEDIA_POLICIES, SUPPORTED_TYPES_DESCRIPTION } = require('../utils/media-types');
const { z } = require('../utils/zod');
const { bearerSecurity, errors, json, success } = require('./openapi.helpers');

const sizeLimits = Object.values(MEDIA_POLICIES)
  .map((policy) => `${policy.label} ${policy.maxBytes / (1024 * 1024)} MB`)
  .join(', ');

const fileEnvelope = success(z.object({ file: fileResponseSchema }));

const uploadDoc = {
  tags: ['Files'],
  summary: 'Upload a media file',
  description: [
    `Accepts ${SUPPORTED_TYPES_DESCRIPTION}. Size limits: ${sizeLimits}.`,
    'The real file type is detected from the file bytes, so renamed/spoofed files are rejected.',
    'Files are public (visible to every signed-in user) unless `visibility=private` is sent.',
    'Emits a `file:uploaded` WebSocket event (to everyone for public files, only to the owner for private ones).',
  ].join('\n\n'),
  security: bearerSecurity,
  request: { body: { content: { 'multipart/form-data': { schema: uploadFileFormSchema } } } },
  responses: {
    201: json(fileEnvelope, 'File uploaded'),
    ...errors(400, 401, 413, 415, 429, 502),
  },
};

function registerFileDocs(registry) {
  registry.registerPath({ method: 'post', path: '/files', ...uploadDoc });
  registry.registerPath({ method: 'post', path: '/upload', ...uploadDoc, summary: 'Upload a media file (alias of POST /files)' });

  registry.registerPath({
    method: 'get',
    path: '/files',
    tags: ['Files'],
    summary: 'Browse files with filters, sorting and pagination',
    description: 'Returns public files plus your own private files (`scope=mine` for only your uploads). `sort=trending` blends views and recency.',
    security: bearerSecurity,
    request: { query: listFilesQuerySchema },
    responses: {
      200: json(success(z.object({ items: z.array(fileResponseSchema) }), paginationMetaSchema), 'Paginated files'),
      ...errors(400, 401),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/files/stats',
    tags: ['Files'],
    summary: 'Storage and view statistics for your uploads',
    security: bearerSecurity,
    responses: { 200: json(success(z.object({ stats: fileStatsSchema })), 'Statistics'), ...errors(401) },
  });

  registry.registerPath({
    method: 'get',
    path: '/files/{id}',
    tags: ['Files'],
    summary: 'Get a file (records a view)',
    description:
      'Public files are visible to every signed-in user; private files only to their owner (others get 404). A user counts as one view per file every 30 minutes. PDFs include `previewPages` (one image per page).',
    security: bearerSecurity,
    request: { params: fileIdParamsSchema },
    responses: { 200: json(fileEnvelope, 'File details'), ...errors(400, 401, 404) },
  });

  registry.registerPath({
    method: 'get',
    path: '/files/{id}/download',
    tags: ['Files'],
    summary: 'Get a short-lived link to the original file',
    description:
      'Returns a signed Cloudinary download URL valid for 10 minutes, with the same access rules as the file itself. It works even when the Cloudinary account restricts direct PDF delivery.',
    security: bearerSecurity,
    request: { params: fileIdParamsSchema },
    responses: { 200: json(success(downloadUrlResponseSchema), 'Download link'), ...errors(400, 401, 404) },
  });

  registry.registerPath({
    method: 'patch',
    path: '/files/{id}',
    tags: ['Files'],
    summary: 'Update title, description, tags or visibility (owner only)',
    security: bearerSecurity,
    request: {
      params: fileIdParamsSchema,
      body: { content: { 'application/json': { schema: updateFileBodySchema } } },
    },
    responses: { 200: json(fileEnvelope, 'Updated file'), ...errors(400, 401, 403, 404) },
  });

  registry.registerPath({
    method: 'delete',
    path: '/files/{id}',
    tags: ['Files'],
    summary: 'Delete a file from Cloudinary and the database (owner only)',
    security: bearerSecurity,
    request: { params: fileIdParamsSchema },
    responses: { 204: { description: 'Deleted' }, ...errors(400, 401, 403, 404, 502) },
  });
}

module.exports = { registerFileDocs };
