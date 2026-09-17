import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MEDIA_CATEGORIES } from '../utils/media';
import { splitList } from '../utils/params';

export const SEARCH_SORTS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'views', label: 'Most viewed' },
  { value: 'size', label: 'Largest' },
  { value: 'name', label: 'Name (A–Z)' },
];

export const BROWSE_SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'trending', label: 'Trending' },
  { value: 'views', label: 'Most viewed' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'size', label: 'Largest' },
  { value: 'name', label: 'Name (A–Z)' },
];

const isDefaultValue = (key, value) =>
  value === '' || value == null || (key === 'scope' && value === 'all') || (key === 'page' && Number(value) === 1);

/**
 * Library filters live in the URL (?q=beach&type=video&page=2), so results can be bookmarked,
 * shared and navigated with the browser's back button.
 */
export const useLibraryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const q = searchParams.get('q') ?? '';
    const isSearch = q.trim().length > 0;
    const sortOptions = isSearch ? SEARCH_SORTS : BROWSE_SORTS;
    const requestedSort = searchParams.get('sort');

    return {
      q,
      isSearch,
      type: splitList(searchParams.get('type')).filter((type) => MEDIA_CATEGORIES.includes(type)),
      tags: splitList(searchParams.get('tags')),
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
      scope: searchParams.get('scope') === 'mine' ? 'mine' : 'all',
      sort: sortOptions.some((option) => option.value === requestedSort) ? requestedSort : sortOptions[0].value,
      sortOptions,
      page: Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1),
    };
  }, [searchParams]);

  /** Merges changes into the URL. Any filter change jumps back to page 1. */
  const updateParams = useCallback(
    (changes) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, rawValue]) => {
          const value = Array.isArray(rawValue) ? rawValue.join(',') : rawValue;
          if (isDefaultValue(key, value)) next.delete(key);
          else next.set(key, String(value));
        });
        if (!('page' in changes)) next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams();
      ['q', 'scope'].forEach((key) => current.get(key) && next.set(key, current.get(key)));
      return next;
    });
  }, [setSearchParams]);

  return { params, updateParams, clearFilters };
};
