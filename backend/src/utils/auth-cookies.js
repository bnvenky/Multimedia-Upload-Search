const { API_PREFIX } = require('../config/constants');
const { cookieSecure, env } = require('../config/env');

const REFRESH_COOKIE_NAME = 'mms_refresh_token';
// Scoped to the auth routes, so the refresh token is never sent along with normal API calls.
const REFRESH_COOKIE_PATH = `${API_PREFIX}/auth`;

function baseCookieOptions() {
  return {
    httpOnly: true, // JavaScript in the browser cannot read it (XSS protection)
    secure: cookieSecure,
    sameSite: env.COOKIE_SAME_SITE,
    path: REFRESH_COOKIE_PATH,
  };
}

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...baseCookieOptions(), expires: expiresAt });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
}

function readRefreshCookie(req) {
  const value = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
};
