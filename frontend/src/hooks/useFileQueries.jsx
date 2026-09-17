import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteFile, fetchDownloadUrl, fetchFile, fetchFiles, fetchStats, updateFile } from '../api/filesApi';
import { invalidateFileQueries, queryKeys } from '../api/queryClient';

const NOT_RETRYABLE = new Set([400, 401, 403, 404]);
const retryUnlessClientError = (failureCount, error) => !NOT_RETRYABLE.has(error?.status) && failureCount < 2;

/** Browse files. Previous results stay visible while the next page or filter loads. */
export const useFilesQuery = (params, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.files.list(params),
    queryFn: ({ signal }) => fetchFiles(params, signal),
    placeholderData: keepPreviousData,
    enabled,
    meta: { errorTitle: 'Could not load files' },
  });

export const useFileQuery = (id) =>
  useQuery({
    queryKey: queryKeys.files.detail(id),
    queryFn: ({ signal }) => fetchFile(id, signal),
    retry: retryUnlessClientError,
    meta: { errorTitle: 'Could not open this file' },
  });

/** Signed links expire after 10 minutes, so they are refreshed well before that. */
export const useDownloadUrlQuery = (id, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.files.download(id),
    queryFn: ({ signal }) => fetchDownloadUrl(id, signal),
    enabled,
    staleTime: 5 * 60_000,
    refetchInterval: 8 * 60_000,
    retry: retryUnlessClientError,
    meta: { errorTitle: 'Could not prepare the original file' },
  });

export const useStatsQuery = () =>
  useQuery({
    queryKey: queryKeys.files.stats(),
    queryFn: ({ signal }) => fetchStats(signal),
    meta: { errorTitle: 'Could not load your statistics' },
  });

export const useUpdateFileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFile,
    meta: { errorTitle: 'Could not save changes' },
    onSuccess: (file) => {
      queryClient.setQueryData(queryKeys.files.detail(file.id), file);
      return invalidateFileQueries(queryClient);
    },
  });
};

export const useDeleteFileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFile,
    meta: { errorTitle: 'Could not delete the file' },
    // The deleted file's own queries are not refetched (they would 404); they expire from the cache.
    onSuccess: (_result, id) => invalidateFileQueries(queryClient, { exceptFileId: id }),
  });
};
