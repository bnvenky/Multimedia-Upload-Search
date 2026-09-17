const { Schema, Types, model } = require('mongoose');
const { MEDIA_CATEGORIES } = require('../utils/media-types');
const { buildSearchIndex } = require('../utils/text-analysis');

const VISIBILITIES = ['public', 'private'];

/** Where and how the binary is stored at the media provider (Cloudinary). */
const storageSchema = new Schema(
  {
    provider: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: null },
    format: { type: String, default: null },
    version: { type: Number },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    pages: { type: Number },
  },
  { _id: false },
);

const mediaFileSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    tags: { type: [String], default: [] },
    originalName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    extension: { type: String, required: true },
    category: { type: String, enum: MEDIA_CATEGORIES, required: true },
    size: { type: Number, required: true, min: 0 },
    visibility: { type: String, enum: VISIBILITIES, default: 'public', required: true },
    storage: { type: storageSchema, required: true },
    views: { type: Number, default: 0, min: 0 },
    lastViewedAt: { type: Date, default: null },
    // Search index kept on the document and rebuilt automatically when searchable fields change.
    searchIndex: {
      tokens: { type: [String], default: [], select: false },
      trigrams: { type: [String], default: [], select: false },
    },
  },
  { timestamps: true },
);

// "My files" and public browsing, newest first, optionally filtered by type.
mediaFileSchema.index({ owner: 1, createdAt: -1 });
mediaFileSchema.index({ visibility: 1, category: 1, createdAt: -1 });
mediaFileSchema.index({ visibility: 1, views: -1 });
// Search: multikey index over character trigrams enables typo-tolerant retrieval.
mediaFileSchema.index({ 'searchIndex.trigrams': 1 });
// Autocomplete: anchored prefix scans over normalized words.
mediaFileSchema.index({ 'searchIndex.tokens': 1 });
// Tag filters and tag suggestions.
mediaFileSchema.index({ tags: 1 });

mediaFileSchema.pre('validate', function rebuildSearchIndex() {
  const searchableChanged = ['title', 'description', 'tags', 'originalName'].some((field) => this.isModified(field));
  if (this.isNew || searchableChanged) {
    this.set(
      'searchIndex',
      buildSearchIndex({
        title: this.title,
        originalName: this.originalName,
        tags: this.tags,
        description: this.description,
      }),
    );
  }
});

const MediaFileModel = model('MediaFile', mediaFileSchema);

module.exports = { MediaFileModel, VISIBILITIES };
