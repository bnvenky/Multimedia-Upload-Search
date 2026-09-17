const { AppError } = require('../utils/app-error');

/**
 * CSRF protection for the cookie-based endpoints (refresh / logout).
 * Browsers always send an `Origin` header on cross-site POST requests, so a request coming
 * from an unknown website is rejected even if the browser attaches the cookie.
 * Requests with no Origin header (curl, Postman, server-to-server) are allowed.
 */
function requireTrustedOrigin(allowedOrigins) {
  const allowed = new Set(allowedOrigins);

  return (req, _res, next) => {
    const origin = req.headers.origin;
    if (!origin) return next();

    const host = req.headers.host;
    const sameOrigin = Boolean(host) && (origin === `https://${host}` || origin === `http://${host}`);
    if (sameOrigin || allowed.has(origin)) return next();

    next(AppError.forbidden('Request origin is not allowed'));
  };
}

module.exports = { requireTrustedOrigin };
