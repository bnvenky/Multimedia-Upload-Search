import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { notifyError } from '../store/notifier';

const isRetryable = (error) => !error?.status || error.status >= 500;

/**
 * Server state (files, search results, stats) is cached and synchronized by TanStack Query.
 * Every failed query or mutation is reported as a toast here, in one place. A query or mutation
 * can set `meta.errorTitle` for a clearer title, or `meta.silent` for background calls.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!query.meta?.silent) notifyError(error, query.meta?.errorTitle ?? 'Could not load data');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!mutation.meta?.silent) notifyError(error, mutation.meta?.errorTitle ?? 'Action failed');
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Client errors (400/401/403/404) will not change on retry; network and server errors might.
      retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});

/** Hierarchical query keys: invalidating ['files'] refreshes lists, details and stats together. */
export const queryKeys = {
  files: {
    all: ['files'],
    list: (params) => ['files', 'list', params],
    detail: (id) => ['files', 'detail', id],
    download: (id) => ['files', 'download', id],
    stats: () => ['files', 'stats'],
  },
  search: {
    all: ['search'],
    results: (params) => ['search', 'results', params],
    suggestions: (q) => ['search', 'suggestions', q],
    tags: (params) => ['search', 'tags', params],
  },
};

/**
 * Call after anything that changes the set of files (upload, edit, delete, real-time event).
 * `exceptFileId` skips that file's own queries, e.g. right after deleting it.
 */
export const invalidateFileQueries = (client = queryClient, { exceptFileId } = {}) =>
  Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.files.all,
      predicate: (query) => !(exceptFileId && query.queryKey[2] === exceptFileId),
    }),
    client.invalidateQueries({ queryKey: queryKeys.search.all }),
  ]);
