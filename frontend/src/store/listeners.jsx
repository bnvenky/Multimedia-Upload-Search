import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { savePreference, THEME_KEY, themeToggled, VIEW_KEY, viewModeChanged } from './uiSlice';

/** Side effects that react to actions live here, which keeps the reducers pure. */
export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: isAnyOf(themeToggled, viewModeChanged),
  effect: (_action, api) => {
    const { theme, viewMode } = api.getState().ui;
    savePreference(THEME_KEY, theme);
    savePreference(VIEW_KEY, viewMode);
  },
});
