const { randomUUID } = require('node:crypto');
const { mkdir, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const multer = require('multer');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { AppError } = require('../utils/app-error');
const { declaredCategory, SUPPORTED_TYPES_DESCRIPTION } = require('../utils/media-types');

const UPLOAD_TMP_DIR = path.join(os.tmpdir(), 'multimedia-search-uploads');

/**
 * Receives ONE file from a multipart/form-data request.
 * - Streams it to a temp file on disk (large videos are never held in memory).
 * - Enforces size / field limits while the body is still arriving.
 * - Rejects unsupported types early, before the whole body is read.
 * - Always deletes the temp file once the response is finished (success, error or abort).
 */
function uploadSingleFile(fieldName = 'file') {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        // Recreated before every upload (not just once at startup): some OS tools — Windows
        // "Storage Sense", an antivirus, a temp-cleanup utility — can delete an idle folder
        // under the OS temp directory while the server keeps running. mkdir is a cheap no-op
        // when the folder already exists, so this makes the upload path self-healing.
        mkdir(UPLOAD_TMP_DIR, { recursive: true })
          .then(() => cb(null, UPLOAD_TMP_DIR))
          .catch((err) => cb(err));
      },
      filename: (_req, _file, cb) => cb(null, randomUUID()),
    }),
    // Browsers send UTF-8 file names without declaring a charset.
    defParamCharset: 'utf8',
    limits: {
      fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
      files: 1,
      fields: 10,
      fieldSize: 16 * 1024,
      parts: 12,
    },
    fileFilter: (_req, file, cb) => {
      if (!declaredCategory(file.mimetype, file.originalname)) {
        return cb(
          AppError.unsupportedMediaType(
            `Unsupported file type "${file.mimetype || 'unknown'}". Supported formats: ${SUPPORTED_TYPES_DESCRIPTION}.`,
          ),
        );
      }
      cb(null, true);
    },
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (error) => {
      const tempPath = req.file?.path;
      if (tempPath) {
        res.once('close', () => {
          rm(tempPath, { force: true }).catch((err) => logger.warn({ err, tempPath }, 'Failed to remove temp upload'));
        });
      }

      if (error) return next(error);
      if (!req.file) {
        return next(AppError.badRequest(`No file received. Send it as multipart/form-data in the "${fieldName}" field.`));
      }
      next();
    });
  };
}

module.exports = { uploadSingleFile };
