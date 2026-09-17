/** Stable, machine-readable error codes the frontend can switch on. */
const ErrorCode = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_ROTATED: 'TOKEN_ROTATED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  RATE_LIMITED: 'RATE_LIMITED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

/**
 * An expected ("operational") error with an HTTP status and error code.
 * Anything thrown that is NOT an AppError is treated as a bug and hidden behind a generic 500.
 */
class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new AppError(400, ErrorCode.BAD_REQUEST, message, details);
  }

  static validation(details, message = 'Request validation failed') {
    return new AppError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = 'Authentication required', code = ErrorCode.UNAUTHORIZED) {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, ErrorCode.NOT_FOUND, message);
  }

  static conflict(message) {
    return new AppError(409, ErrorCode.CONFLICT, message);
  }

  static payloadTooLarge(message) {
    return new AppError(413, ErrorCode.PAYLOAD_TOO_LARGE, message);
  }

  static unsupportedMediaType(message, details) {
    return new AppError(415, ErrorCode.UNSUPPORTED_MEDIA_TYPE, message, details);
  }

  static storage(message = 'File storage is temporarily unavailable') {
    return new AppError(502, ErrorCode.STORAGE_ERROR, message);
  }
}

module.exports = { AppError, ErrorCode };
