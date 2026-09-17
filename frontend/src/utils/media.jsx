import { FileText, Image, Music, Video } from 'lucide-react';

const MB = 1024 * 1024;

/**
 * Mirrors the API allow-list (backend/src/utils/media-types.js) for instant feedback.
 * The server still re-validates every upload, including the real file bytes.
 *
 * `tone` holds complete Tailwind class names (Tailwind only generates classes it can find
 * written out in full, so they cannot be built with string templates).
 */
export const MEDIA_TYPES = {
  image: {
    label: 'Image',
    plural: 'Images',
    icon: Image,
    maxBytes: 10 * MB,
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    tone: {
      text: 'text-cat-image',
      fill: 'bg-cat-image',
      soft: 'bg-cat-image/15',
      activeChip: 'border-cat-image/50 bg-cat-image/15',
      glow: 'from-cat-image/25',
    },
  },
  video: {
    label: 'Video',
    plural: 'Videos',
    icon: Video,
    maxBytes: 100 * MB,
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    extensions: ['mp4', 'm4v', 'webm', 'mov'],
    tone: {
      text: 'text-cat-video',
      fill: 'bg-cat-video',
      soft: 'bg-cat-video/15',
      activeChip: 'border-cat-video/50 bg-cat-video/15',
      glow: 'from-cat-video/25',
    },
  },
  audio: {
    label: 'Audio',
    plural: 'Audio',
    icon: Music,
    maxBytes: 50 * MB,
    mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/flac', 'audio/webm'],
    extensions: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'weba'],
    tone: {
      text: 'text-cat-audio',
      fill: 'bg-cat-audio',
      soft: 'bg-cat-audio/15',
      activeChip: 'border-cat-audio/50 bg-cat-audio/15',
      glow: 'from-cat-audio/25',
    },
  },
  pdf: {
    label: 'PDF',
    plural: 'PDFs',
    icon: FileText,
    maxBytes: 10 * MB,
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
    tone: {
      text: 'text-cat-pdf',
      fill: 'bg-cat-pdf',
      soft: 'bg-cat-pdf/15',
      activeChip: 'border-cat-pdf/50 bg-cat-pdf/15',
      glow: 'from-cat-pdf/25',
    },
  },
};

export const MEDIA_CATEGORIES = Object.keys(MEDIA_TYPES);

export const ACCEPT_ATTRIBUTE = Object.values(MEDIA_TYPES)
  .flatMap((type) => [...type.mimeTypes, ...type.extensions.map((extension) => `.${extension}`)])
  .join(',');

export const extensionOf = (fileName = '') => /\.([a-z0-9]+)$/i.exec(fileName)?.[1].toLowerCase() ?? '';

/**
 * Some files pick up a second, unrelated extension when shared or re-saved by another app
 * (e.g. a voice note exported as "clip.mp3.mpeg"). If the outermost extension isn't one we
 * recognize, this also tries the extension just before it. The server verifies the real file
 * content regardless, so this only avoids rejecting a valid file for a cosmetic reason.
 */
export const detectCategory = (file) => {
  const outerExtension = extensionOf(file.name);
  const direct = MEDIA_CATEGORIES.find(
    (category) => MEDIA_TYPES[category].mimeTypes.includes(file.type) || MEDIA_TYPES[category].extensions.includes(outerExtension),
  );
  if (direct || !outerExtension) return direct;

  const innerExtension = extensionOf(file.name.slice(0, -(outerExtension.length + 1)));
  return innerExtension ? MEDIA_CATEGORIES.find((category) => MEDIA_TYPES[category].extensions.includes(innerExtension)) : undefined;
};

/** Returns { category } for an acceptable file, or { error } explaining the rejection. */
export const validateFile = (file) => {
  const category = detectCategory(file);
  if (!category) return { error: 'Unsupported format. Use images, videos, audio or PDF files.' };
  if (file.size === 0) return { error: 'The file is empty.' };

  const { maxBytes, label } = MEDIA_TYPES[category];
  if (file.size > maxBytes) return { error: `${label} files must be ${maxBytes / MB} MB or smaller.` };

  return { category };
};

/** "summer_trip-2024.mp4" -> "summer trip 2024" (same rule as the API) */
export const titleFromFileName = (name) =>
  name
    .replace(/\.[a-z0-9]{1,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'Untitled';
