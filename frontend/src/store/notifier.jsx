import { getErrorMessage } from '../utils/errors';
import { showToast } from './toastsSlice';

/**
 * One place to show notifications from anywhere — components, TanStack Query callbacks,
 * thunks — without passing `dispatch` around. The store's dispatch is plugged in once in main.jsx.
 */
let dispatchToStore = null;

export const connectNotifier = (dispatch) => {
  dispatchToStore = dispatch;
};

const notifyWith =
  (type) =>
  (title, message, extra = {}) =>
    dispatchToStore?.(showToast({ type, title, message, ...extra }));

export const notify = {
  success: notifyWith('success'),
  info: notifyWith('info'),
  error: notifyWith('error'),
};

const SESSION_ERROR_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'SESSION_REVOKED']);

/** Shows any error as a toast. Cancelled requests are ignored; lost sessions get one friendly message. */
export const notifyError = (error, title = 'Something went wrong') => {
  if (!error || error.name === 'AbortError' || error.code === 'ABORTED') return;

  if (SESSION_ERROR_CODES.has(error.code)) {
    notify.error('Session expired', 'Please sign in again.');
    return;
  }
  notify.error(title, getErrorMessage(error));
};
