import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryClient';
import { fetchPopularTags, fetchSuggestions, searchFiles } from '../api/searchApi';

/** Ranked search. Previous results stay on screen while the user keeps typing. */
export const useSearchQuery = (params, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.search.results(params),
    queryFn: ({ signal }) => searchFiles(params, signal),
    placeholderData: keepPreviousData,
    enabled,
    meta: { errorTitle: 'Search failed' },
  });

/** Autocomplete is a background helper, so its errors stay silent. */
export const useSuggestionsQuery = (q) =>
  useQuery({
    queryKey: queryKeys.search.suggestions(q),
    queryFn: ({ signal }) => fetchSuggestions(q, signal),
    enabled: q.length >= 2,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    meta: { silent: true },
  });

export const usePopularTagsQuery = (params) =>
  useQuery({
    queryKey: queryKeys.search.tags(params),
    queryFn: ({ signal }) => fetchPopularTags(params, signal),
    staleTime: 60_000,
    meta: { silent: true },
  });
