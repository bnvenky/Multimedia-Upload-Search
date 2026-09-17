const { createHash, randomBytes, randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError, ErrorCode } = require('../utils/app-error');
const { USER_ROLES } = require('../models/user.model');

const defaultConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  accessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

/**
 * Token helpers with no database access:
 * - short-lived signed JWT access tokens (HS256)
 * - long random opaque refresh tokens (their storage lives in SessionService)
 */
class TokenService {
  constructor(config = defaultConfig) {
    this.config = config;
  }

  get accessTokenTtlSeconds() {
    return this.config.accessTtlSeconds;
  }

  signAccessToken(user) {
    const payload = { sub: user.id, email: user.email, role: user.role, typ: 'access' };
    return jwt.sign(payload, this.config.accessSecret, {
      algorithm: 'HS256',
      expiresIn: this.config.accessTtlSeconds,
      issuer: this.config.issuer,
      audience: this.config.audience,
      jwtid: randomUUID(),
    });
  }

  /** Returns `{ id, email, role, expiresAt }` or throws a 401 AppError. */
  verifyAccessToken(token) {
    let decoded;
    try {
      // Pinning the algorithm blocks "alg: none" and algorithm-confusion attacks.
      decoded = jwt.verify(token, this.config.accessSecret, {
        algorithms: ['HS256'],
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Access token has expired', ErrorCode.TOKEN_EXPIRED);
      }
      throw AppError.unauthorized('Access token is invalid', ErrorCode.INVALID_TOKEN);
    }

    const isValidShape =
      typeof decoded === 'object' &&
      decoded.typ === 'access' &&
      typeof decoded.sub === 'string' &&
      typeof decoded.email === 'string' &&
      USER_ROLES.includes(decoded.role) &&
      typeof decoded.exp === 'number';

    if (!isValidShape) {
      throw AppError.unauthorized('Access token is invalid', ErrorCode.INVALID_TOKEN);
    }

    return { id: decoded.sub, email: decoded.email, role: decoded.role, expiresAt: decoded.exp * 1000 };
  }

  generateRefreshToken() {
    const token = randomBytes(48).toString('base64url');
    return { token, tokenHash: TokenService.hashToken(token) };
  }

  static hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
  }
}

module.exports = { TokenService };
