const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
const { z } = require('zod');

/**
 * One Zod instance extended with `.openapi()`. Every request schema is written once and used
 * for both runtime validation and the generated Swagger docs, so the docs never drift from
 * what the API really accepts.
 */
extendZodWithOpenApi(z);

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid id')
  .openapi({ example: '66f1c2a4b7e4a1d2c3b4a5f6' });

module.exports = { z, objectIdSchema };
