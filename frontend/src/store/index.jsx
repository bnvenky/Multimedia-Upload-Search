import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { listenerMiddleware } from './listeners';
import toastsReducer from './toastsSlice';
import uiReducer from './uiSlice';
import uploadsReducer from './uploadsSlice';

/**
 * Redux holds CLIENT state: the auth session, the upload queue, UI preferences and toasts.
 * Server data (files, search, stats) is owned by TanStack Query (see api/queryClient.jsx).
 */
export const makeStore = (preloadedState) =>
  configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      uploads: uploadsReducer,
      toasts: toastsReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  });

export const store = makeStore();
