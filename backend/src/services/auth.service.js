const bcrypt = require('bcryptjs');
const { env } = require('../config/env');
const { AppError, ErrorCode } = require('../utils/app-error');
const { UserModel, toPublicUser } = require('../models/user.model');

class AuthService {
  constructor(tokens, sessions, bcryptRounds = env.BCRYPT_ROUNDS) {
    this.tokens = tokens;
    this.sessions = sessions;
    this.bcryptRounds = bcryptRounds;
    this.dummyHash = null;
  }

  async register({ name, email, password }, context) {
    const exists = await UserModel.exists({ email });
    if (exists) {
      throw AppError.conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, this.bcryptRounds);
    const user = await UserModel.create({ name, email, passwordHash, lastLoginAt: new Date() });

    return this.startSession(user, context);
  }

  async login({ email, password }, context) {
    const user = await UserModel.findOne({ email }).select('+passwordHash');

    if (!user) {
      // Still run bcrypt so the response time does not reveal whether the email exists.
      await bcrypt.compare(password, await this.getDummyHash());
      throw AppError.unauthorized('Invalid email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw AppError.unauthorized('Invalid email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.startSession(user, context);
  }

  async refresh(refreshToken, context) {
    if (!refreshToken) {
      throw AppError.unauthorized('No active session', ErrorCode.UNAUTHORIZED);
    }

    const rotated = await this.sessions.rotate(refreshToken, context);
    const user = await UserModel.findById(rotated.userId);
    if (!user) {
      await this.sessions.revokeAllForUser(rotated.userId);
      throw AppError.unauthorized('Account no longer exists', ErrorCode.SESSION_REVOKED);
    }

    return this.buildSession(user, rotated.token, rotated.expiresAt);
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await this.sessions.revoke(refreshToken);
    }
  }

  async logoutEverywhere(userId) {
    await this.sessions.revokeAllForUser(userId);
  }

  async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.unauthorized('Account no longer exists', ErrorCode.INVALID_TOKEN);
    }
    return toPublicUser(user);
  }

  async startSession(user, context) {
    const refresh = await this.sessions.issue(user._id, context);
    return this.buildSession(user, refresh.token, refresh.expiresAt);
  }

  buildSession(user, refreshToken, refreshTokenExpiresAt) {
    const publicUser = toPublicUser(user);
    const accessToken = this.tokens.signAccessToken(publicUser);
    return {
      user: publicUser,
      accessToken,
      expiresIn: this.tokens.accessTokenTtlSeconds,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  getDummyHash() {
    this.dummyHash ??= bcrypt.hash('timing-attack-mitigation-placeholder', this.bcryptRounds);
    return this.dummyHash;
  }
}

module.exports = { AuthService };
