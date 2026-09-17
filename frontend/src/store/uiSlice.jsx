import { createSlice } from '@reduxjs/toolkit';

export const THEME_KEY = 'mediavault.theme';
export const VIEW_KEY = 'mediavault.view';

const readPreference = (key, allowed, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

export const savePreference = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: the preference is simply not remembered.
  }
};

const prefersLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: readPreference(THEME_KEY, ['dark', 'light'], prefersLight ? 'light' : 'dark'),
    viewMode: readPreference(VIEW_KEY, ['grid', 'list'], 'grid'),
    sidebarOpen: false,
    realtimeStatus: 'offline', // 'connecting' | 'live' | 'offline'
  },
  reducers: {
    themeToggled: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    viewModeChanged: (state, action) => {
      state.viewMode = action.payload;
    },
    sidebarToggled: (state, action) => {
      state.sidebarOpen = action.payload ?? !state.sidebarOpen;
    },
    realtimeStatusChanged: (state, action) => {
      state.realtimeStatus = action.payload;
    },
  },
});

export const { themeToggled, viewModeChanged, sidebarToggled, realtimeStatusChanged } = uiSlice.actions;

export const selectTheme = (state) => state.ui.theme;
export const selectViewMode = (state) => state.ui.viewMode;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectRealtimeStatus = (state) => state.ui.realtimeStatus;

export default uiSlice.reducer;
