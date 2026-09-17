import { apiRequest } from './httpClient';

// Credential endpoints never trigger the automatic token refresh.

export const loginRequest = async (credentials) =>
  (await apiRequest('/auth/login', { method: 'POST', body: credentials, skipAuthRefresh: true })).data;

export const registerRequest = async (account) =>
  (await apiRequest('/auth/register', { method: 'POST', body: account, skipAuthRefresh: true })).data;

export const logoutRequest = () => apiRequest('/auth/logout', { method: 'POST', skipAuthRefresh: true });

export const logoutAllRequest = () => apiRequest('/auth/logout-all', { method: 'POST' });
