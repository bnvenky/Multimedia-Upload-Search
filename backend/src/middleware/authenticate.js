const { AppError } = require('../utils/app-error');

function extractBearerToken(header) {
  if (!header) return undefined;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

/** Verifies the `Authorization: Bearer <jwt>` header and sets `req.user = { id, email, role }`. */
function createAuthenticate(tokens) {
  return function authenticate(req, _res, next) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return next(AppError.unauthorized('Authentication required. Provide a Bearer access token.'));
    }

    const { id, email, role } = tokens.verifyAccessToken(token);
    req.user = { id, email, role };
    next();
  };
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
}

module.exports = { createAuthenticate, authorize, extractBearerToken };
