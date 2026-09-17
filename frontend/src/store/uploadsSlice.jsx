import { createSlice, nanoid } from '@reduxjs/toolkit';
import { invalidateFileQueries } from '../api/queryClient';
import { refreshSession } from '../api/session';
import { uploadRequest } from '../api/uploadRequest';
import { detectCategory } from '../utils/media';
import { selectAccessToken } from './authSlice';
import { notifyError } from './notifier';

/**
 * Upload queue (client state). Redux holds only serializable progress data; File objects
 * and AbortControllers live in the module-level Maps below.
 * status: 'queued' | 'uploading' | 'done' | 'error' | 'canceled'
 */
const findUpload = (state, id) => state.items.find((upload) => upload.id === id);

const uploadsSlice = createSlice({
  name: 'uploads',
  initialState: { items: [] },
  reducers: {
    uploadQueued: (state, action) => {
      state.items.unshift({ ...action.payload, status: 'queued', progress: 0, error: null, fileId: null });
    },
    uploadStarted: (state, action) => {
      const upload = findUpload(state, action.payload);
      if (upload) Object.assign(upload, { status: 'uploading', progress: 0, error: null });
    },
    uploadProgressed: (state, action) => {
      const upload = findUpload(state, action.payload.id);
      if (upload) upload.progress = action.payload.progress;
    },
    uploadSucceeded: (state, action) => {
      const upload = findUpload(state, action.payload.id);
      if (upload) Object.assign(upload, { status: 'done', progress: 100, fileId: action.payload.fileId });
    },
    uploadFailed: (state, action) => {
      const upload = findUpload(state, action.payload.id);
      if (upload) Object.assign(upload, { status: action.payload.canceled ? 'canceled' : 'error', error: action.payload.error });
    },
    uploadRemoved: (state, action) => {
      state.items = state.items.filter((upload) => upload.id !== action.payload);
    },
    finishedUploadsCleared: (state) => {
      state.items = state.items.filter((upload) => upload.status === 'queued' || upload.status === 'uploading');
    },
  },
});

export const { uploadQueued, uploadStarted, uploadProgressed, uploadSucceeded, uploadFailed, uploadRemoved, finishedUploadsCleared } =
  uploadsSlice.actions;

export const selectUploads = (state) => state.uploads.items;
export const selectActiveUploadCount = (state) =>
  state.uploads.items.filter((upload) => upload.status === 'queued' || upload.status === 'uploading').length;

export default uploadsSlice.reducer;

/* --------------------------------- Thunks --------------------------------- */

const MAX_PARALLEL_UPLOADS = 3;
const pendingFiles = new Map(); // uploadId -> { file, metadata }
const controllers = new Map(); // uploadId -> AbortController

let activeUploads = 0;
const waitingForSlot = [];

/** Runs at most MAX_PARALLEL_UPLOADS uploads at once; the others wait in order. */
const withUploadSlot = async (task) => {
  if (activeUploads >= MAX_PARALLEL_UPLOADS) {
    await new Promise((resolve) => waitingForSlot.push(resolve));
  }
  activeUploads += 1;
  try {
    return await task();
  } finally {
    activeUploads -= 1;
    waitingForSlot.shift()?.();
  }
};

const performUpload = async (id, dispatch, getState) => {
  const entry = pendingFiles.get(id);
  if (!entry) return;

  const controller = new AbortController();
  controllers.set(id, controller);
  dispatch(uploadStarted(id));

  const send = (accessToken) =>
    uploadRequest({
      file: entry.file,
      metadata: entry.metadata,
      accessToken,
      signal: controller.signal,
      onProgress: (progress) => dispatch(uploadProgressed({ id, progress })),
    });

  try {
    let file;
    try {
      file = await send(selectAccessToken(getState()));
    } catch (error) {
      const tokenExpired = error.status === 401 && ['TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(error.code);
      if (!tokenExpired) throw error;
      const newToken = await refreshSession(dispatch);
      if (!newToken) throw error;
      file = await send(newToken);
    }

    pendingFiles.delete(id);
    dispatch(uploadSucceeded({ id, fileId: file.id }));
    invalidateFileQueries();
  } catch (error) {
    dispatch(uploadFailed({ id, error: error.message, canceled: error.code === 'ABORTED' }));
    // Cancellations are ignored by notifyError; real failures show a toast.
    notifyError(error, `Upload failed: ${entry.metadata.title || entry.file.name}`);
  } finally {
    controllers.delete(id);
  }
};

export const startUpload =
  ({ file, metadata }) =>
  (dispatch, getState) => {
    const id = nanoid();
    pendingFiles.set(id, { file, metadata });
    dispatch(
      uploadQueued({
        id,
        name: file.name,
        title: metadata.title || file.name,
        size: file.size,
        category: detectCategory(file) ?? 'unknown',
      }),
    );
    return withUploadSlot(() => performUpload(id, dispatch, getState));
  };

export const cancelUpload = (id) => () => {
  controllers.get(id)?.abort();
};

export const retryUpload = (id) => (dispatch, getState) => withUploadSlot(() => performUpload(id, dispatch, getState));

export const removeUpload = (id) => (dispatch) => {
  controllers.get(id)?.abort();
  pendingFiles.delete(id);
  dispatch(uploadRemoved(id));
};
