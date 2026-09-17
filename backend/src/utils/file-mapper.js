/** `owner` may be an ObjectId or a populated `{ _id, name }` object. */
function toOwner(owner) {
  if (!owner) return { id: '', name: 'Deleted user' };
  if (owner._id) return { id: owner._id.toString(), name: owner.name ?? 'Unknown' };
  return { id: owner.toString(), name: 'Unknown' };
}

function ownerIdOf(record) {
  return toOwner(record.owner).id;
}

const MAX_PREVIEW_PAGES = 30;
const CLOUDINARY_PDF_URL = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)\.pdf$/i;

/**
 * One image URL per PDF page, rendered by Cloudinary (pg_N transformation).
 * Page images are delivered even on accounts where direct PDF delivery is restricted (HTTP 401),
 * so the in-app preview always works.
 */
function pdfPagePreviewUrls(url, pages) {
  const match = CLOUDINARY_PDF_URL.exec(url ?? '');
  if (!match) return [];
  const [, base, assetPath] = match;
  const count = Math.min(Math.max(pages ?? 1, 1), MAX_PREVIEW_PAGES);
  return Array.from({ length: count }, (_, index) => `${base}pg_${index + 1},w_1400,c_limit,q_auto,f_auto/${assetPath}.jpg`);
}

/**
 * Converts a MongoDB record into the public API shape.
 * This is an explicit allow-list: internal fields (Cloudinary public id, search index, ...)
 * can never leak to clients by accident.
 * `includePreviews` adds PDF page images (details view only, to keep lists small).
 */
function toFileDto(record, { includePreviews = false } = {}) {
  const storage = record.storage ?? {};
  return {
    id: record._id.toString(),
    title: record.title,
    description: record.description ?? '',
    tags: record.tags ?? [],
    originalName: record.originalName,
    mimeType: record.mimeType,
    extension: record.extension,
    category: record.category,
    size: record.size,
    visibility: record.visibility,
    url: storage.url,
    thumbnailUrl: storage.thumbnailUrl ?? null,
    width: storage.width ?? null,
    height: storage.height ?? null,
    duration: storage.duration ?? null,
    pages: storage.pages ?? null,
    views: record.views ?? 0,
    lastViewedAt: record.lastViewedAt ?? null,
    owner: toOwner(record.owner),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(includePreviews && {
      previewPages: record.category === 'pdf' ? pdfPagePreviewUrls(storage.url, storage.pages) : [],
    }),
  };
}

module.exports = { toFileDto, ownerIdOf, pdfPagePreviewUrls };
