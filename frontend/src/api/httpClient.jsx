import { cleanParams } from '../utils/params';
import { API_URL } from './config';

/** Error thrown for every failed API call: { status, code, message, details }. */
export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * The client needs the current access token and a way to refresh it, both owned by Redux.
 * They are plugged in once from main.jsx, which keeps this module free of store imports.
 */
let authBridge = {
  getAccessToken: () => null,
  refreshSession: async () => null,
};

export const connectAuth = (bridge) => {
  authBridge = bridge;
};

const REFRESHABLE_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED']);

const buildUrl = (path, params) => {
  const query = new URLSearchParams(cleanParams(params)).toString();
  return `${API_URL}${path}${query ? `?${query}` : ''}`;
};

const send = async (path, { method = 'GET', body, params, signal, accessToken }) => {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server. Check your connection and try again.' });
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: payload?.error?.code,
      message: payload?.error?.message ?? `Request failed (HTTP ${response.status})`,
      details: payload?.error?.details,
    });
  }
  return payload;
};

/**
 * Calls the API and returns the JSON envelope `{ success, data, meta }`.
 * When the access token has expired, the session is refreshed once and the call retried,
 * so users are never signed out while they are active.
 */
export const apiRequest = async (path, { skipAuthRefresh = false, ...options } = {}) => {
  try {
    return await send(path, { ...options, accessToken: authBridge.getAccessToken() });
  } catch (error) {
    const canRefresh = !skipAuthRefresh && error instanceof ApiError && error.status === 401 && REFRESHABLE_CODES.has(error.code);
    if (!canRefresh) throw error;

    const accessToken = await authBridge.refreshSession();
    if (!accessToken) throw error;
    return send(path, { ...options, accessToken });
  }
};
