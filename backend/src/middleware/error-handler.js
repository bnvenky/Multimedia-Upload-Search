const mongoose = require('mongoose');
const { MulterError } = require('multer');
const { env, isProduction } = require('../config/env');
const { logger } = require('../config/logger');
const { AppError, ErrorCode } = require('../utils/app-error');

function fromMulterError(error) {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return AppError.payloadTooLarge(`File exceeds the maximum upload size of ${env.MAX_UPLOAD_MB} MB`);
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return AppError.badRequest('Upload exactly one file per request using the multipart field "file"');
    default:
      return AppError.badRequest(`Invalid multipart payload: ${error.message}`);
  }
}

/** Converts known library errors into AppErrors. Unknown errors become a generic 500. */
function normalizeError(error) {
  if (error instanceof AppError) return error;
  if (error instanceof MulterError) return fromMulterError(error);

  if (error instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Invalid value for "${error.path}"`);
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({ path: item.path, message: item.message }));
    return AppError.validation(details);
  }
  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue ?? {})[0] ?? 'resource';
    return AppError.conflict(`A record with this ${field} already exists`);
  }

  // Errors raised by express.json() while parsing the body
  if (error?.type === 'entity.parse.failed') return AppError.badRequest('Malformed JSON request body');
  if (error?.type === 'entity.too.large') return AppError.payloadTooLarge('Request body is too large');

  return new AppError(500, ErrorCode.INTERNAL_ERROR, 'Something went wrong on our side. Please try again.');
}

// Express recognises error handlers by their 4 arguments, so `_next` must stay.
function errorHandler(error, req, res, _next) {
  const appError = normalizeError(error);
  const requestId = req.id ? String(req.id) : undefined;
  const log = req.log ?? logger;

  if (appError.statusCode >= 500) {
    log.error({ err: error, requestId }, 'Unhandled request error');
  } else {
    log.debug({ code: appError.code, message: appError.message }, 'Request rejected');
  }

  if (res.headersSent) return;

  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined && { details: appError.details }),
      ...(requestId && { requestId }),
      // Extra debugging info outside production only; never leak internals to real users.
      ...(!isProduction && !(error instanceof AppError) && error instanceof Error && { debug: error.message }),
    },
  });
}

function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.path} does not exist`));
}

module.exports = { errorHandler, notFoundHandler, normalizeError };
