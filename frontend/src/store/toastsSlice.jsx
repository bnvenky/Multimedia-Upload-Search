import { createSlice, nanoid } from '@reduxjs/toolkit';

const MAX_TOASTS = 4;

const isSameToast = (a, b) => a.type === b.type && a.title === b.title && a.message === b.message;

const toastsSlice = createSlice({
  name: 'toasts',
  initialState: [],
  reducers: {
    showToast: {
      reducer: (state, action) => {
        // The same message twice in a row (e.g. a retried request) is shown only once.
        if (state.some((toast) => isSameToast(toast, action.payload))) return;
        state.push(action.payload);
        if (state.length > MAX_TOASTS) state.shift();
      },
      // type: 'success' | 'error' | 'info'; link: optional in-app route
      prepare: ({ type = 'info', title, message, link }) => ({
        payload: { id: nanoid(), type, title, message, link },
      }),
    },
    dismissToast: (state, action) => state.filter((toast) => toast.id !== action.payload),
  },
});

export const { showToast, dismissToast } = toastsSlice.actions;
export const selectToasts = (state) => state.toasts;
export default toastsSlice.reducer;
