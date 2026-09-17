const { bearerSecurity, errors, json, success } = require('./openapi.helpers');
const { z } = require('../utils/zod');
const { REFRESH_COOKIE_NAME } = require('../utils/auth-cookies');
const { authResponseSchema, loginSchema, publicUserSchema, registerSchema } = require('../schemas/auth.schema');

const setCookieHeader = {
  'Set-Cookie': {
    description: `HTTP-only \`${REFRESH_COOKIE_NAME}\` refresh token cookie (rotated on every refresh)`,
    schema: { type: 'string' },
  },
};

function registerAuthDocs(registry) {
  registry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    summary: 'Create an account',
    description: 'Creates a user, returns a short-lived access token and sets the refresh token cookie.',
    request: { body: { content: { 'application/json': { schema: registerSchema } } } },
    responses: {
      201: { ...json(success(authResponseSchema), 'Account created and signed in'), headers: setCookieHeader },
      ...errors(400, 409, 429),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Sign in with email and password',
    request: { body: { content: { 'application/json': { schema: loginSchema } } } },
    responses: {
      200: { ...json(success(authResponseSchema), 'Signed in'), headers: setCookieHeader },
      ...errors(400, 401, 429),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/refresh',
    tags: ['Auth'],
    summary: 'Rotate the refresh token and get a new access token',
    description:
      'Consumes the refresh token cookie and issues a new one in the same session family. Re-using an already consumed token revokes the whole family (token theft detection).',
    security: [{ refreshCookie: [] }],
    responses: {
      200: { ...json(success(authResponseSchema), 'New access token issued'), headers: setCookieHeader },
      204: { description: 'No refresh cookie was sent — the visitor is not signed in' },
      ...errors(401, 403, 429),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    summary: 'Sign out of the current session',
    security: [{ refreshCookie: [] }],
    responses: { 204: { description: 'Signed out; refresh cookie cleared' }, ...errors(403) },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/logout-all',
    tags: ['Auth'],
    summary: 'Sign out of every session (all devices)',
    security: bearerSecurity,
    responses: { 204: { description: 'All sessions revoked' }, ...errors(401) },
  });

  registry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags: ['Auth'],
    summary: 'Get the signed-in user',
    security: bearerSecurity,
    responses: { 200: json(success(z.object({ user: publicUserSchema })), 'Current user'), ...errors(401) },
  });
}

module.exports = { registerAuthDocs };
