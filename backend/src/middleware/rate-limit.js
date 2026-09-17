const { ipKeyGenerator, rateLimit } = require('express-rate-limit');
const { AppError, ErrorCode } = require('../utils/app-error');

const MINUTE = 60 * 1000;

function limiter({ message, ...options }) {
  return rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new AppError(429, ErrorCode.RATE_LIMITED, message)),
    ...options,
  });
}

const clientIp = (req) => ipKeyGenerator(req.ip ?? 'unknown');
const passthrough = (_req, _res, next) => next();

/**
 * Layered rate limits:
 *  - api:     generous global ceiling per IP
 *  - auth:    tighter ceiling on register/login per IP
 *  - login:   brute-force guard per IP + email, counting only FAILED attempts
 *  - refresh: separate budget so page reloads never lock users out
 *  - upload:  per-user upload quota
 * A fresh set is created per app instance, so tests do not share counters.
 */
function createRateLimiters({ enabled = true } = {}) {
  if (!enabled) {
    return { api: passthrough, auth: passthrough, login: passthrough, refresh: passthrough, upload: passthrough };
  }

  return {
    api: limiter({
      windowMs: 15 * MINUTE,
      limit: 1000,
      message: 'Too many requests, please slow down and try again shortly',
    }),
    auth: limiter({
      windowMs: 15 * MINUTE,
      limit: 30,
      message: 'Too many authentication attempts, please try again later',
    }),
    login: limiter({
      windowMs: 15 * MINUTE,
      limit: 10,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        return `${clientIp(req)}:${email}`;
      },
      message: 'Too many failed sign-in attempts for this account, please try again in 15 minutes',
    }),
    refresh: limiter({
      windowMs: 15 * MINUTE,
      limit: 120,
      message: 'Too many session refresh attempts, please try again later',
    }),
    upload: limiter({
      windowMs: 60 * MINUTE,
      limit: 60,
      keyGenerator: (req) => req.user?.id ?? clientIp(req),
      message: 'Upload limit reached (60 files per hour), please try again later',
    }),
  };
}

module.exports = { createRateLimiters };
