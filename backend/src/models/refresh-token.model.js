const { Schema, Types, model } = require('mongoose');

const REVOCATION_REASONS = ['rotated', 'logout', 'logout_all', 'reuse_detected'];

/**
 * One document per issued refresh token.
 * - Only a SHA-256 hash is stored, so a database leak does not expose usable tokens.
 * - Tokens created from the same login share a `family`, so the whole chain can be revoked
 *   at once if token theft is detected.
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, enum: [...REVOCATION_REASONS, null], default: null },
    createdByIp: { type: String, default: null },
    userAgent: { type: String, default: null, maxlength: 512 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL index: MongoDB deletes sessions automatically once they expire.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = model('RefreshToken', refreshTokenSchema);

module.exports = { RefreshTokenModel, REVOCATION_REASONS };
