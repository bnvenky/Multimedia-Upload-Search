import { createSlice } from '@reduxjs/toolkit';

/**
 * status: 'idle' -> 'checking' (restoring the session on page load) -> 'authenticated' | 'anonymous'
 *
 * The access token lives only in memory (never localStorage), so an XSS bug cannot steal a
 * long-lived credential. The refresh token is an HTTP-only cookie that JavaScript cannot read.
 */
const initialState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionCheckStarted: (state) => {
      state.status = 'checking';
    },
    sessionReceived: (state, action) => {
      const { user, accessToken, expiresIn } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.expiresAt = Date.now() + expiresIn * 1000;
      state.status = 'authenticated';
    },
    sessionCleared: () => ({ ...initialState, status: 'anonymous' }),
  },
});

export const { sessionCheckStarted, sessionReceived, sessionCleared } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectAuthStatus = (state) => state.auth.status;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';

export default authSlice.reducer;
