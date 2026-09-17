import { apiRequest } from './httpClient';

export const fetchFiles = async (params, signal) => {
  const response = await apiRequest('/files', { params, signal });
  return { items: response.data.items, meta: response.meta };
};

export const fetchFile = async (id, signal) => (await apiRequest(`/files/${id}`, { signal })).data.file;

/** Short-lived signed link to the original file (works even when Cloudinary restricts PDF delivery). */
export const fetchDownloadUrl = async (id, signal) => (await apiRequest(`/files/${id}/download`, { signal })).data;

export const fetchStats = async (signal) => (await apiRequest('/files/stats', { signal })).data.stats;

export const updateFile = async ({ id, ...changes }) =>
  (await apiRequest(`/files/${id}`, { method: 'PATCH', body: changes })).data.file;

export const deleteFile = (id) => apiRequest(`/files/${id}`, { method: 'DELETE' });
