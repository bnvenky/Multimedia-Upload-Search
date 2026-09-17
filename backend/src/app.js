const path = require('node:path');
const { randomUUID } = require('node:crypto');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { pinoHttp } = require('pino-http');
const swaggerUi = require('swagger-ui-express');

const { API_PREFIX, DOCS_PATH } = require('./config/constants');
const { cookieSecure, env } = require('./config/env');
const { logger } = require('./config/logger');
const { buildOpenApiDocument } = require('./docs/openapi');

const { createAuthenticate } = require('./middleware/authenticate');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const { createRateLimiters } = require('./middleware/rate-limit');
const { requireTrustedOrigin } = require('./middleware/trusted-origin');

const { AuthService } = require('./services/auth.service');
const { FileService } = require('./services/file.service');
const { SearchService } = require('./services/search.service');
const { SessionService } = require('./services/session.service');
const { TokenService } = require('./services/token.service');

const { createAuthController } = require('./controllers/auth.controller');
const { createFileController } = require('./controllers/file.controller');
const { createHealthController } = require('./controllers/health.controller');
const { createSearchController } = require('./controllers/search.controller');

const { createApiRouter } = require('./routes');

const REQUEST_ID_PATTERN = /^[\w-]{8,64}$/;

function securityHeaders() {
  const cloudinary = 'https://res.cloudinary.com';
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', cloudinary],
        mediaSrc: ["'self'", 'blob:', cloudinary],
        frameSrc: ["'self'", cloudinary],
        connectSrc: ["'self'", 'ws:', 'wss:', ...env.CLIENT_ORIGINS],
        // PDFs are previewed with <object>; only Cloudinary-hosted documents may be embedded.
        objectSrc: [cloudinary],
        frameAncestors: ["'self'"],
        // Only force HTTPS sub-resources when the app itself is served over HTTPS.
        upgradeInsecureRequests: cookieSecure ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
}

function requestLogger() {
  return pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers['x-request-id'];
      const id = typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (_req, res, error) => {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: { ignore: (req) => req.url?.startsWith(`${API_PREFIX}/health`) ?? false },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  });
}

/** Serves the built React app (optional single-service deployment). */
function serveClient(app) {
  const distPath = path.resolve(__dirname, '..', env.CLIENT_DIST_PATH);

  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        // Vite adds a content hash to asset file names, so they can be cached forever.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  // Single-page app fallback: every other GET returns index.html and React Router takes over.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/**
 * Builds the Express app. Dependencies are passed in (dependency injection), so tests can
 * use an in-memory storage instead of Cloudinary and disable rate limiting.
 */
function createApp({ storage, events, enableRateLimit = true }) {
  // --- Services (business logic) ---
  const tokenService = new TokenService();
  const sessionService = new SessionService(tokenService);
  const authService = new AuthService(tokenService, sessionService);
  const fileService = new FileService(storage, events);
  const searchService = new SearchService();

  // --- Controllers (HTTP layer) ---
  const controllers = {
    auth: createAuthController(authService),
    files: createFileController(fileService),
    search: createSearchController(searchService),
    health: createHealthController(storage),
  };

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  // --- Global middleware ---
  app.use(requestLogger());
  app.use(securityHeaders());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || env.CLIENT_ORIGINS.includes(origin)),
      credentials: true,
      exposedHeaders: ['X-Request-Id', 'Location'],
      maxAge: 600,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  // --- API ---
  app.use(
    API_PREFIX,
    createApiRouter({
      controllers,
      authenticate: createAuthenticate(tokenService),
      trustedOrigin: requireTrustedOrigin(env.CLIENT_ORIGINS),
      limiters: createRateLimiters({ enabled: enableRateLimit }),
    }),
  );

  // --- Swagger docs ---
  const openApiDocument = buildOpenApiDocument();
  app.get(`${DOCS_PATH}/openapi.json`, (_req, res) => res.json(openApiDocument));
  app.use(
    DOCS_PATH,
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: 'Multimedia Search API Docs',
      swaggerOptions: { persistAuthorization: true, validatorUrl: null },
    }),
  );

  if (env.SERVE_CLIENT) serveClient(app);

  // --- Errors (must be registered last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, tokenService };
}

module.exports = { createApp };
