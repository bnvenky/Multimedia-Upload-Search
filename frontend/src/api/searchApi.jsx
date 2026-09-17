import { apiRequest } from './httpClient';

export const searchFiles = async (params, signal) => {
  const response = await apiRequest('/search', { params, signal });
  return { items: response.data.items, meta: response.meta };
};

export const fetchSuggestions = async (q, signal) =>
  (await apiRequest('/search/suggestions', { params: { q, limit: 6 }, signal })).data;

export const fetchPopularTags = async (params, signal) => (await apiRequest('/search/tags', { params, signal })).data.tags;
