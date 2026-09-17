export const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Empty means "same origin as the page" (Vite proxy in development, or backend-served build).
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;
