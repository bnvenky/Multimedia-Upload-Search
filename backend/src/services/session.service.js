const { randomUUID } = require('node:crypto');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { AppError, ErrorCode } = require('../utils/app-error');
const { RefreshTokenModel } = require('../models/refresh-token.model');
const { TokenService } = require('./token.service');

/** Two tabs refreshing at the same moment should not look like token theft. */
const ROTATION_GRACE_MS = 10_000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Refresh-token sessions with rotation + reuse detection (OAuth 2.0 Security Best Practice):
 * every refresh consumes the presented token and issues a new one in the same "family".
 * If an already-consumed token is presented again, someone has a copy of it, so the whole
 * family is revoked and both the attacker and the user must sign in again.
 */
class SessionService {
  constructor(tokens, ttlDays = env.REFRESH_TOKEN_TTL_DAYS) {
    this.tokens = tokens;
    this.ttlDays = ttlDays;
  }

  async issue(userId, context = {}, family = randomUUID()) {
    const { token, tokenHash } = this.tokens.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.ttlDays * DAY_MS);

    await RefreshTokenModel.create({
      user: userId,
      tokenHash,
      family,
      expiresAt,
      createdByIp: context.ip ?? null,
      userAgent: context.userAgent ? context.userAgent.slice(0, 512) : null,
    });

    return { token, expiresAt };
  }

  async rotate(rawToken, context = {}) {
    const tokenHash = TokenService.hashToken(rawToken);
    const now = new Date();

    // Atomic "claim": only one request can ever consume a given refresh token.
    const consumed = await RefreshTokenModel.findOneAndUpdate(
      { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
      { $set: { revokedAt: now, revokedReason: 'rotated' } },
    );

    if (consumed) {
      const next = await this.issue(consumed.user, context, consumed.family);
      return { userId: consumed.user.toString(), ...next };
    }

    const existing = await RefreshTokenModel.findOne({ tokenHash });
    if (!existing) {
      throw AppError.unauthorized('Refresh token is invalid', ErrorCode.INVALID_TOKEN);
    }
    if (!existing.revokedAt) {
      throw AppError.unauthorized('Session has expired, please sign in again', ErrorCode.SESSION_REVOKED);
    }

    const msSinceRevocation = now.getTime() - existing.revokedAt.getTime();
    if (existing.revokedReason === 'rotated' && msSinceRevocation < ROTATION_GRACE_MS) {
      throw AppError.unauthorized('Refresh token was just rotated, retry with the latest token', ErrorCode.TOKEN_ROTATED);
    }

    const { modifiedCount } = await RefreshTokenModel.updateMany(
      { family: existing.family, revokedAt: null },
      { $set: { revokedAt: now, revokedReason: 'reuse_detected' } },
    );
    logger.warn(
      { userId: existing.user.toString(), family: existing.family, revokedSessions: modifiedCount, ip: context.ip },
      'Refresh token reuse detected, session family revoked',
    );
    throw AppError.unauthorized('Session has been revoked, please sign in again', ErrorCode.SESSION_REVOKED);
  }

  async revoke(rawToken) {
    await RefreshTokenModel.updateOne(
      { tokenHash: TokenService.hashToken(rawToken), revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'logout' } },
    );
  }

  async revokeAllForUser(userId) {
    await RefreshTokenModel.updateMany(
      { user: userId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'logout_all' } },
    );
  }
}

module.exports = { SessionService, ROTATION_GRACE_MS };
