const { Router } = require('express');
const { createAuthRouter } = require('./auth.routes');
const { createFileRouter, uploadHandlers } = require('./file.routes');
const { createHealthRouter } = require('./health.routes');
const { createSearchRouter } = require('./search.routes');

/**
 * All API routes, mounted under /api/v1 in app.js.
 *
 *   /health              liveness & readiness
 *   /auth/*              register, login, refresh, logout, me
 *   /files/*             upload, browse, get, update, delete, stats
 *   /upload              alias of POST /files
 *   /search/*            ranked search, suggestions, popular tags
 */
function createApiRouter({ controllers, authenticate, trustedOrigin, limiters }) {
  const router = Router();

  router.use('/health', createHealthRouter({ controller: controllers.health }));

  router.use(limiters.api);

  router.use('/auth', createAuthRouter({ controller: controllers.auth, authenticate, trustedOrigin, limiters }));
  router.use('/files', createFileRouter({ controller: controllers.files, authenticate, limiters }));
  router.post('/upload', authenticate, ...uploadHandlers({ controller: controllers.files, limiters }));
  router.use('/search', createSearchRouter({ controller: controllers.search, authenticate }));

  return router;
}

module.exports = { createApiRouter };
