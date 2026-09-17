const { v2: cloudinary } = require('cloudinary');
const { env } = require('../../config/env');
const { logger } = require('../../config/logger');
const { AppError, ErrorCode } = require('../../utils/app-error');

const CHUNKED_UPLOAD_THRESHOLD = 20 * 1024 * 1024;
const CHUNK_SIZE = 6 * 1024 * 1024;
const THUMBNAIL = { width: 640, height: 400 };

/** Cloudinary delivers audio through its "video" pipeline and PDFs through its "image" pipeline. */
const RESOURCE_TYPE = {
  image: 'image',
  pdf: 'image',
  video: 'video',
  audio: 'video',
};

/**
 * Storage provider backed by Cloudinary.
 *
 * Any storage provider (this one, the in-memory fake used in tests, or a future S3 one)
 * exposes the same methods, so FileService does not care where files live:
 *   - isConfigured(): boolean
 *   - upload({ filePath, category, mimeType, size, ownerId }): Promise<storedAsset>
 *   - remove({ publicId, resourceType }): Promise<void>
 *   - createDownloadUrl({ publicId, resourceType, format }): { url, expiresAt }
 */
class CloudinaryStorage {
  constructor({ baseFolder = env.CLOUDINARY_FOLDER, configured = Boolean(env.CLOUDINARY_URL) } = {}) {
    this.name = 'cloudinary';
    this.baseFolder = baseFolder;
    this.configured = configured;
    // The SDK reads CLOUDINARY_URL from the environment by itself; we only force HTTPS URLs.
    cloudinary.config({ secure: true });
  }

  isConfigured() {
    return this.configured;
  }

  async upload({ filePath, category, size, ownerId }) {
    if (!this.configured) {
      throw new AppError(503, ErrorCode.SERVICE_UNAVAILABLE, 'Media storage is not configured on the server');
    }

    const resourceType = RESOURCE_TYPE[category];
    const options = {
      resource_type: resourceType,
      folder: `${this.baseFolder}/${ownerId}`,
      unique_filename: true,
      use_filename: false,
      overwrite: false,
      ...(category === 'pdf' && { pages: true }),
    };

    let result;
    try {
      result = await this.send(filePath, options, size > CHUNKED_UPLOAD_THRESHOLD);
    } catch (error) {
      logger.error({ err: error, category }, 'Cloudinary upload failed');
      throw AppError.storage('Could not store the file with our media provider. Please try again.');
    }

    return {
      provider: this.name,
      publicId: result.public_id,
      resourceType,
      url: result.secure_url,
      thumbnailUrl: this.thumbnailUrl(category, result),
      format: result.format ?? null,
      bytes: result.bytes,
      version: result.version,
      width: result.width,
      height: result.height,
      duration: typeof result.duration === 'number' ? result.duration : undefined,
      pages: result.pages,
    };
  }

  async remove({ publicId, resourceType }) {
    try {
      const response = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
      if (response.result !== 'ok' && response.result !== 'not found') {
        throw new Error(`Unexpected destroy result: ${response.result}`);
      }
    } catch (error) {
      logger.error({ err: error, publicId }, 'Cloudinary delete failed');
      throw AppError.storage('Could not delete the file from our media provider. Please try again.');
    }
  }

  /**
   * Signed, expiring download URL served by Cloudinary's authenticated API. Unlike the public CDN
   * URL it is not affected by the "restrict PDF delivery" account setting.
   */
  createDownloadUrl({ publicId, resourceType, format, expiresInSeconds = 600 }) {
    if (!this.configured) {
      throw new AppError(503, ErrorCode.SERVICE_UNAVAILABLE, 'Media storage is not configured on the server');
    }
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const url = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: 'upload',
      expires_at: expiresAt,
    });
    return { url, expiresAt: new Date(expiresAt * 1000) };
  }

  send(filePath, options, chunked) {
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error || !result) return reject(error instanceof Error ? error : new Error(JSON.stringify(error)));
        resolve(result);
      };

      if (chunked) {
        // Cloudinary requires chunked uploads for large files; each chunk is retried on its own.
        cloudinary.uploader.upload_large(filePath, { ...options, chunk_size: CHUNK_SIZE }, callback);
      } else {
        cloudinary.uploader.upload(filePath, options, callback);
      }
    });
  }

  /** Preview images generated on the fly by Cloudinary transformations. */
  thumbnailUrl(category, result) {
    const common = { secure: true, version: result.version };
    switch (category) {
      case 'image':
        return cloudinary.url(result.public_id, {
          ...common,
          resource_type: 'image',
          transformation: [{ ...THUMBNAIL, crop: 'fill', gravity: 'auto', fetch_format: 'auto', quality: 'auto' }],
        });
      case 'video':
        // A frame from the video
        return cloudinary.url(result.public_id, {
          ...common,
          resource_type: 'video',
          format: 'jpg',
          transformation: [{ start_offset: 'auto', ...THUMBNAIL, crop: 'fill', quality: 'auto' }],
        });
      case 'audio':
        // A waveform image of the audio track
        return cloudinary.url(result.public_id, {
          ...common,
          resource_type: 'video',
          format: 'png',
          transformation: [{ flags: 'waveform', color: '#7C5CFF', background: 'transparent', width: 640, height: 200 }],
        });
      case 'pdf':
        // The first page rendered as an image
        return cloudinary.url(result.public_id, {
          ...common,
          resource_type: 'image',
          format: 'jpg',
          transformation: [{ page: 1, ...THUMBNAIL, crop: 'fill', gravity: 'north', quality: 'auto' }],
        });
      default:
        return null;
    }
  }
}

module.exports = { CloudinaryStorage };
