import { CloudUpload, SearchX } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Segmented from '../components/common/Segmented';
import { EmptyState, ErrorState } from '../components/common/StateViews';
import FileGrid, { FileGridSkeleton } from '../components/files/FileGrid';
import PageHeader from '../components/layout/PageHeader';
import FilterBar from '../components/search/FilterBar';
import Pagination from '../components/search/Pagination';
import PopularTags from '../components/search/PopularTags';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFilesQuery } from '../hooks/useFileQueries';
import { useLibraryParams } from '../hooks/useLibraryParams';
import { useSearchQuery } from '../hooks/useSearchQueries';
import { selectViewMode } from '../store/uiSlice';
import { cn } from '../utils/cn';
import { getErrorMessage } from '../utils/errors';

const PAGE_SIZE = 12;

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'mine', label: 'Mine' },
];

const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

const LibraryPage = () => {
  const navigate = useNavigate();
  const viewMode = useSelector(selectViewMode);
  const { params, updateParams, clearFilters } = useLibraryParams();

  const filters = {
    type: params.type,
    tags: params.tags,
    from: params.from,
    to: params.to,
    scope: params.scope,
    sort: params.sort,
    page: params.page,
    limit: PAGE_SIZE,
  };

  // Browsing and searching use different endpoints; only the relevant query runs.
  const searchQuery = useSearchQuery({ query: params.q.trim(), ...filters }, { enabled: params.isSearch });
  const browseQuery = useFilesQuery(filters, { enabled: !params.isSearch });
  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = params.isSearch ? searchQuery : browseQuery;

  const title = params.isSearch ? `Results for “${params.q.trim()}”` : params.scope === 'mine' ? 'My files' : 'Explore library';
  useDocumentTitle(title);

  const meta = data?.meta;
  const files = data?.items ?? [];
  const hasFilters = params.type.length > 0 || params.tags.length > 0 || params.from || params.to;

  const summary = !meta
    ? ' '
    : params.isSearch
      ? `${pluralize(meta.total, 'match', 'matches')} · ranked in ${meta.tookMs} ms`
      : pluralize(meta.total, 'file');

  const toggleTag = (tag) =>
    updateParams({ tags: params.tags.includes(tag) ? params.tags.filter((item) => item !== tag) : [...params.tags, tag] });

  const renderResults = () => {
    if (isPending) return <FileGridSkeleton layout={viewMode} />;
    if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

    if (files.length === 0) {
      return params.isSearch || hasFilters ? (
        <EmptyState
          icon={SearchX}
          title="No files match"
          message="Try different keywords — search tolerates typos — or remove some filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={CloudUpload}
          title={params.scope === 'mine' ? 'You have not uploaded anything yet' : 'The library is empty'}
          message="Upload images, videos, audio or PDFs to get started."
          action={
            <Button icon={CloudUpload} onClick={() => navigate('/upload')}>
              Upload files
            </Button>
          }
        />
      );
    }

    // Previous results stay visible (dimmed) while the next page or query loads — no skeleton flash.
    return (
      <div className={cn('transition-opacity', isFetching && isPlaceholderData && 'opacity-60')}>
        <FileGrid files={files} terms={meta?.terms ?? []} layout={viewMode} />
      </div>
    );
  };

  return (
    <div>
      <PageHeader title={title} description={summary}>
        <Segmented label="Scope" options={SCOPE_OPTIONS} value={params.scope} onChange={(scope) => updateParams({ scope })} />
      </PageHeader>

      <FilterBar params={params} updateParams={updateParams} clearFilters={clearFilters} />
      <PopularTags scope={params.scope} selected={params.tags} onSelect={toggleTag} />

      {renderResults()}

      <Pagination
        meta={meta}
        onPageChange={(page) => {
          updateParams({ page });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default LibraryPage;
