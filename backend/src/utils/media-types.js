const path = require('node:path');
const { AppError } = require('./app-error');

const MEDIA_CATEGORIES = ['image', 'video', 'audio', 'pdf'];

const MB = 1024 * 1024;

/**
 * Upload allow-list per category.
 * Size limits match Cloudinary's free plan (10 MB for image resources, which include PDFs;
 * 100 MB for video resources, which include audio).
 * SVG is intentionally NOT allowed because it can contain executable JavaScript.
 */
const MEDIA_POLICIES = {
  image: {
    label: 'Image',
    maxBytes: 10 * MB,
    types: {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
    },
  },
  video: {
    label: 'Video',
    maxBytes: 100 * MB,
    types: {
      'video/mp4': ['mp4', 'm4v'],
      'video/webm': ['webm'],
      'video/quicktime': ['mov'],
    },
  },
  audio: {
    label: 'Audio',
    maxBytes: 50 * MB,
    types: {
      'audio/mpeg': ['mp3'],
      'audio/wav': ['wav'],
      'audio/ogg': ['ogg', 'oga'],
      'audio/mp4': ['m4a'],
      'audio/aac': ['aac'],
      'audio/flac': ['flac'],
      'audio/webm': ['weba'],
    },
  },
  pdf: {
    label: 'PDF',
    maxBytes: 10 * MB,
    types: { 'application/pdf': ['pdf'] },
  },
};

/** Different browsers/OSes report the same format under different MIME names. */
const MIME_ALIASES = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'audio/mp3': 'audio/mpeg',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
  'audio/x-m4a': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/x-aac': 'audio/aac',
  'audio/x-flac': 'audio/flac',
  'application/x-pdf': 'application/pdf',
};

const SUPPORTED_TYPES_DESCRIPTION =
  'images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, MOV), audio (MP3, WAV, OGG, M4A, AAC, FLAC) and PDF documents';

/** How many leading bytes `detectMimeFromSignature` needs. */
const SIGNATURE_BYTES = 1024;

function canonicalMime(mime = '') {
  const normalized = mime.trim().toLowerCase().split(';')[0];
  return MIME_ALIASES[normalized] ?? normalized;
}

function fileExtension(fileName) {
  return path.extname(fileName).slice(1).toLowerCase();
}

function categoryForMime(mime) {
  const canonical = canonicalMime(mime);
  return MEDIA_CATEGORIES.find((category) => canonical in MEDIA_POLICIES[category].types);
}

function categoryForExtension(extension) {
  return MEDIA_CATEGORIES.find((category) =>
    Object.values(MEDIA_POLICIES[category].types).some((extensions) => extensions.includes(extension)),
  );
}

/**
 * Quick check using what the client CLAIMS (MIME type / extension). Used to reject early,
 * before the authoritative magic-byte check in resolveMedia() runs.
 *
 * Some files pick up a second, unrelated extension when shared or re-saved by another app
 * (e.g. a voice note exported as "clip.mp3.mpeg"). If the outermost extension isn't one we
 * recognize, this also tries the extension just before it, so such files aren't rejected
 * purely because of an extra suffix — the real content is still verified afterwards.
 */
function declaredCategory(mime, fileName) {
  const outerExtension = fileExtension(fileName);
  const direct = categoryForMime(mime) ?? categoryForExtension(outerExtension);
  if (direct || !outerExtension) return direct;

  const innerExtension = fileExtension(fileName.slice(0, -(outerExtension.length + 1)));
  return innerExtension ? categoryForExtension(innerExtension) : undefined;
}

const ascii = (buffer, start, end) => buffer.toString('latin1', start, end);

/**
 * Detects the REAL file format from its first bytes ("magic numbers").
 * The Content-Type header and file extension can be faked by renaming a file,
 * so they are never trusted on their own.
 */
function detectMimeFromSignature(header, declaredMime = '') {
  if (!header || header.length < 4) return undefined;
  const declared = categoryForMime(declaredMime);

  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg';
  if (header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (ascii(header, 0, 6) === 'GIF87a' || ascii(header, 0, 6) === 'GIF89a') return 'image/gif';

  if (ascii(header, 0, 4) === 'RIFF') {
    const format = ascii(header, 8, 12);
    if (format === 'WEBP') return 'image/webp';
    if (format === 'WAVE') return 'audio/wav';
    return undefined;
  }

  if (ascii(header, 4, 8) === 'ftyp') {
    const brand = ascii(header, 8, 12);
    if (['M4A ', 'M4B ', 'M4P '].includes(brand)) return 'audio/mp4';
    if (brand === 'qt  ') return 'video/quicktime';
    // Generic MP4 brands (isom, mp42, ...) are used for both audio-only and video files.
    return declared === 'audio' ? 'audio/mp4' : 'video/mp4';
  }

  if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) {
    return declared === 'audio' ? 'audio/webm' : 'video/webm';
  }

  if (ascii(header, 0, 4) === 'OggS') return 'audio/ogg';
  if (ascii(header, 0, 4) === 'fLaC') return 'audio/flac';
  if (ascii(header, 0, 3) === 'ID3') return 'audio/mpeg';

  if (header[0] === 0xff && (header[1] & 0xe0) === 0xe0) {
    // MPEG audio frame: layer bits "00" mean AAC (ADTS), anything else is MP3.
    return (header[1] & 0x06) === 0 ? 'audio/aac' : 'audio/mpeg';
  }

  // A PDF header may appear anywhere in the first 1024 bytes.
  if (ascii(header, 0, Math.min(header.length, SIGNATURE_BYTES)).includes('%PDF-')) return 'application/pdf';

  return undefined;
}

/**
 * Final server-side decision about an uploaded file.
 * Returns { category, mimeType, extension } or throws 400 / 413 / 415.
 */
function resolveMedia({ header, declaredMime, originalName, size }) {
  const detectedMime = detectMimeFromSignature(header, declaredMime);
  const detectedCategory = detectedMime ? categoryForMime(detectedMime) : undefined;

  if (!detectedMime || !detectedCategory) {
    throw AppError.unsupportedMediaType(
      `The file content is not a supported format. Supported formats: ${SUPPORTED_TYPES_DESCRIPTION}.`,
    );
  }

  const claimed = declaredCategory(declaredMime, originalName);
  if (claimed && claimed !== detectedCategory) {
    throw AppError.unsupportedMediaType(
      `The file content does not match its declared type (declared ${claimed}, detected ${detectedCategory}).`,
      { declared: claimed, detected: detectedCategory },
    );
  }

  if (size === 0) {
    throw AppError.badRequest('The uploaded file is empty.');
  }

  const policy = MEDIA_POLICIES[detectedCategory];
  if (size > policy.maxBytes) {
    throw AppError.payloadTooLarge(`${policy.label} files must be ${policy.maxBytes / MB} MB or smaller.`);
  }

  const validExtensions = policy.types[detectedMime] ?? [];
  const declaredExtension = fileExtension(originalName);
  const extension = validExtensions.includes(declaredExtension) ? declaredExtension : (validExtensions[0] ?? declaredExtension);

  return { category: detectedCategory, mimeType: detectedMime, extension };
}

module.exports = {
  MEDIA_CATEGORIES,
  MEDIA_POLICIES,
  SUPPORTED_TYPES_DESCRIPTION,
  SIGNATURE_BYTES,
  canonicalMime,
  fileExtension,
  categoryForMime,
  declaredCategory,
  detectMimeFromSignature,
  resolveMedia,
};
