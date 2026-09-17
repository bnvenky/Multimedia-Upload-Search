const { AppError, ErrorCode } = require('../utils/app-error');
const { sendSuccess } = require('../utils/response');
const { clearRefreshCookie, readRefreshCookie, setRefreshCookie } = require('../utils/auth-cookies');

const clientContext = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

/**
 * The refresh token only travels inside the HTTP-only cookie.
 * The JSON body carries the short-lived access token, which the frontend keeps in memory.
 */
function sendSession(res, session, status = 200) {
  setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
  res.setHeader('Cache-Control', 'no-store');
  return sendSuccess(
    res,
    { user: session.user, accessToken: session.accessToken, tokenType: 'Bearer', expiresIn: session.expiresIn },
    { status },
  );
}

// Express 5 forwards errors thrown in async handlers to the error middleware automatically.
function createAuthController(authService) {
  return {
    async register(req, res) {
      const session = await authService.register(req.validated.body, clientContext(req));
      sendSession(res, session, 201);
    },

    async login(req, res) {
      const session = await authService.login(req.validated.body, clientContext(req));
      sendSession(res, session);
    },

    async refresh(req, res) {
      const refreshToken = readRefreshCookie(req);
      // No cookie simply means "not signed in" (e.g. a first visit), which is not an error.
      if (!refreshToken) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(204).end();
      }

      try {
        const session = await authService.refresh(refreshToken, clientContext(req));
        sendSession(res, session);
      } catch (error) {
        // TOKEN_ROTATED means a parallel request already stored a newer cookie in the browser — keep it.
        const rotatedConcurrently = error instanceof AppError && error.code === ErrorCode.TOKEN_ROTATED;
        if (!rotatedConcurrently) clearRefreshCookie(res);
        throw error;
      }
    },

    async logout(req, res) {
      await authService.logout(readRefreshCookie(req));
      clearRefreshCookie(res);
      res.status(204).end();
    },

    async logoutAll(req, res) {
      await authService.logoutEverywhere(req.user.id);
      clearRefreshCookie(res);
      res.status(204).end();
    },

    async me(req, res) {
      sendSuccess(res, { user: await authService.getProfile(req.user.id) });
    },
  };
}

module.exports = { createAuthController };
