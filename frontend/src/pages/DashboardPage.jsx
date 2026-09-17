import { CloudUpload, Eye, Files, HardDrive, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryBadge } from '../components/common/Badge';
import Button from '../components/common/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/common/StateViews';
import FileGrid, { FileGridSkeleton } from '../components/files/FileGrid';
import FileThumbnail from '../components/files/FileThumbnail';
import StorageBreakdown from '../components/files/StorageBreakdown';
import PageHeader from '../components/layout/PageHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFilesQuery, useStatsQuery } from '../hooks/useFileQueries';
import { cn } from '../utils/cn';
import { getErrorMessage } from '../utils/errors';
import { formatBytes, formatCount } from '../utils/format';
import { cardClass, linkButtonClass } from '../utils/styles';

const StatTile = ({ icon: Icon, label, value, loading }) => (
  <div className={cn(cardClass, 'grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 px-5 py-4.5')}>
    <span className="row-span-2 grid size-10.5 place-items-center rounded-xl bg-accent-soft text-accent">
      <Icon size={18} aria-hidden />
    </span>
    <span className="text-[0.82rem] text-muted">{label}</span>
    {/* Large standalone figures use proportional digits. */}
    {loading ? <Skeleton className="h-8.5 w-22.5" /> : <strong className="text-[1.7rem] leading-tight font-bold tracking-tight">{value}</strong>}
  </div>
);

const Panel = ({ title, icon: Icon, children }) => (
  <section className={cn(cardClass, 'grid content-start gap-3.5 p-5')}>
    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
      {Icon && <Icon size={18} aria-hidden />}
      {title}
    </h2>
    {children}
  </section>
);

const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const stats = useStatsQuery();
  const recent = useFilesQuery({ scope: 'mine', sort: 'newest', limit: 4 });
  const trending = useFilesQuery({ sort: 'trending', limit: 5 });

  if (stats.error) return <ErrorState message={getErrorMessage(stats.error)} onRetry={stats.refetch} />;

  return (
    <div>
      <PageHeader title="Dashboard" description="Your uploads at a glance.">
        <Button icon={CloudUpload} onClick={() => navigate('/upload')}>
          Upload files
        </Button>
      </PageHeader>

      <section aria-label="Totals" className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile icon={Files} label="Files uploaded" value={formatCount(stats.data?.totalFiles)} loading={stats.isPending} />
        <StatTile icon={HardDrive} label="Storage used" value={formatBytes(stats.data?.totalBytes ?? 0)} loading={stats.isPending} />
        <StatTile icon={Eye} label="Total views" value={formatCount(stats.data?.totalViews)} loading={stats.isPending} />
      </section>

      <div className="mb-7 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel title="Storage by type">
          {stats.isPending ? (
            <Skeleton className="h-44" />
          ) : stats.data.totalFiles === 0 ? (
            <p className="text-muted">Upload a file to see how your storage is split across images, videos, audio and PDFs.</p>
          ) : (
            <StorageBreakdown stats={stats.data} />
          )}
        </Panel>

        <Panel title="Trending now" icon={TrendingUp}>
          {trending.isPending ? (
            <Skeleton className="h-56" />
          ) : trending.data?.items.length ? (
            <ol className="grid gap-2.5">
              {trending.data.items.map((file, index) => (
                <li key={file.id} className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-subtle">{index + 1}</span>
                  <Link to={`/files/${file.id}`} tabIndex={-1} aria-hidden className="w-18 shrink-0 overflow-hidden rounded-lg">
                    <FileThumbnail file={file} />
                  </Link>
                  <div className="grid min-w-0 gap-1">
                    <Link to={`/files/${file.id}`} className="truncate font-semibold hover:text-accent">
                      {file.title}
                    </Link>
                    <span className="flex items-center gap-1.5 text-[0.78rem] text-muted">
                      <CategoryBadge category={file.category} /> {formatCount(file.views)} views
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted">Nothing trending yet.</p>
          )}
        </Panel>
      </div>

      <section>
        <header className="mb-3.5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your recent uploads</h2>
          <Link to="/?scope=mine" className={linkButtonClass}>
            View all
          </Link>
        </header>
        {recent.isPending ? (
          <FileGridSkeleton count={4} />
        ) : recent.data?.items.length ? (
          <FileGrid files={recent.data.items} />
        ) : (
          <EmptyState icon={CloudUpload} title="No uploads yet" message="Your latest files will appear here." />
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
