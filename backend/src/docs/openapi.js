const { OpenAPIRegistry, OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const { API_PREFIX } = require('../config/constants');
const { REFRESH_COOKIE_NAME } = require('../utils/auth-cookies');
const { z } = require('../utils/zod');
const { registerAuthDocs } = require('./auth.docs');
const { registerFileDocs } = require('./file.docs');
const { json, success } = require('./openapi.helpers');
const { registerSearchDocs } = require('./search.docs');

const DESCRIPTION = `
Secure REST API to upload, preview and search multimedia files (images, videos, audio, PDFs).

**Authentication** — \`POST /auth/login\` returns a 15-minute JWT access token and sets an HTTP-only refresh
token cookie. Send the access token as \`Authorization: Bearer <token>\`. When it expires (\`401 TOKEN_EXPIRED\`)
call \`POST /auth/refresh\` to get a new one.

**Try it here** — run *login*, copy \`data.accessToken\`, click **Authorize** and paste it.

**Errors** — always \`{ success: false, error: { code, message, details?, requestId } }\`.

**Real-time** — Socket.IO on the same host (\`auth: { token }\`) emits \`file:uploaded\`, \`file:updated\`, \`file:deleted\`.
`.trim();

function registerHealthDocs(registry) {
  registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['Health'],
    summary: 'Liveness probe',
    responses: {
      200: json(
        success(z.object({ status: z.literal('ok'), uptimeSeconds: z.number(), timestamp: z.string() })),
        'Service is alive',
      ),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/health/ready',
    tags: ['Health'],
    summary: 'Readiness probe (database + storage)',
    responses: {
      200: { description: 'Ready to serve traffic' },
      503: { description: 'A required dependency is unavailable' },
    },
  });
}

/** Builds the OpenAPI 3 document from the same Zod schemas used for validation. */
function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.registerComponent('securitySchemes', 'bearerAuth', { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' });
  registry.registerComponent('securitySchemes', 'refreshCookie', { type: 'apiKey', in: 'cookie', name: REFRESH_COOKIE_NAME });

  registerHealthDocs(registry);
  registerAuthDocs(registry);
  registerFileDocs(registry);
  registerSearchDocs(registry);

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: { title: 'Multimedia Upload & Search API', version: '1.0.0', description: DESCRIPTION },
    servers: [{ url: API_PREFIX }],
    tags: [
      { name: 'Auth', description: 'Registration, login and sessions (JWT + rotating refresh tokens)' },
      { name: 'Files', description: 'Upload, view, update and delete media' },
      { name: 'Search', description: 'Ranked keyword search, autocomplete and tags' },
      { name: 'Health', description: 'Liveness and readiness probes' },
    ],
  });
}

module.exports = { buildOpenApiDocument };
