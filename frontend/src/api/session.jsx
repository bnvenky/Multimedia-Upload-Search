import { sessionCheckStarted, sessionCleared, sessionReceived } from '../store/authSlice';
import { API_URL } from './config';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestRefresh = async () => {
  const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
  const body = await response.json().catch(() => null);
  return { ok: response.ok, body };
};

let refreshInFlight = null;

/**
 * Exchanges the HTTP-only refresh cookie for a new access token and stores the session in Redux.
 * Single-flight: when many requests hit 401 together, only ONE refresh call is made.
 * Resolves to the new access token, or null when the session is over.
 */
export const refreshSession = (dispatch) => {
  refreshInFlight ??= (async () => {
    try {
      let result = await requestRefresh();

      // Another tab rotated the cookie a moment ago; the browser already holds the newer one.
      if (!result.ok && result.body?.error?.code === 'TOKEN_ROTATED') {
        await delay(300);
        result = await requestRefresh();
      }

      // 200 with a session means signed in; 204 means there is no session cookie at all.
      if (result.ok && result.body?.data) {
        dispatch(sessionReceived(result.body.data));
        return result.body.data.accessToken;
      }
    } catch {
      // Network failure: continue as signed out; the login page explains connection problems.
    }
    dispatch(sessionCleared());
    return null;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

/** Thunk run once on page load: restores the session from the refresh cookie, if there is one. */
export const restoreSession = () => async (dispatch) => {
  dispatch(sessionCheckStarted());
  await refreshSession(dispatch);
};
