const { Schema, Types, model } = require('mongoose');

/** A user's view of a file only counts once in this window, so refresh-spam cannot game the ranking. */
const VIEW_DEDUP_WINDOW_SECONDS = 30 * 60;

const fileViewSchema = new Schema({
  file: { type: Types.ObjectId, ref: 'MediaFile', required: true },
  viewer: { type: Types.ObjectId, ref: 'User', required: true },
  // TTL: MongoDB removes the record after the window, allowing the next view to count.
  createdAt: { type: Date, default: Date.now, expires: VIEW_DEDUP_WINDOW_SECONDS },
});

fileViewSchema.index({ file: 1, viewer: 1 }, { unique: true });

const FileViewModel = model('FileView', fileViewSchema);

module.exports = { FileViewModel, VIEW_DEDUP_WINDOW_SECONDS };
