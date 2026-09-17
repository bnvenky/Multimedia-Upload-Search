const { z } = require('../utils/zod');

const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
      message: z.string().openapi({ example: 'Validation failed — email: Must be a valid email address' }),
      details: z.unknown().optional(),
      requestId: z.string().optional().openapi({ example: '5d1f0b1e-8a0b-4d8f-9c43-5e0b1a8a9f11' }),
    }),
  })
  .openapi('ErrorResponse');

const ERROR_DESCRIPTIONS = {
  400: 'Validation failed or malformed request',
  401: 'Missing, invalid or expired credentials (UNAUTHORIZED, TOKEN_EXPIRED, INVALID_TOKEN, INVALID_CREDENTIALS, SESSION_REVOKED, TOKEN_ROTATED)',
  403: 'Authenticated but not allowed',
  404: 'Resource not found',
  409: 'Conflict with existing data',
  413: 'File exceeds the size limit for its type',
  415: 'Unsupported or spoofed file type',
  429: 'Rate limit exceeded',
  502: 'Media storage provider failure',
};

/** A JSON response definition. */
function json(schema, description) {
  return { description, content: { 'application/json': { schema } } };
}

/** Wraps a data schema in the standard `{ success: true, data, meta? }` envelope. */
function success(data, meta) {
  return z.object({ success: z.literal(true), data, ...(meta && { meta }) });
}

/** Standard error responses for the given status codes. */
function errors(...statusCodes) {
  return Object.fromEntries(
    statusCodes.map((status) => [status, json(errorResponseSchema, ERROR_DESCRIPTIONS[status] ?? 'Error')]),
  );
}

const bearerSecurity = [{ bearerAuth: [] }];

module.exports = { errorResponseSchema, json, success, errors, bearerSecurity };
