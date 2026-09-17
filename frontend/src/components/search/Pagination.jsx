import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { pageWindow } from '../../utils/pagination';

const pageButtonClass =
  'inline-grid h-9.5 min-w-9.5 place-items-center rounded-lg border border-line bg-surface px-2.5 font-semibold text-muted tabular-nums transition enabled:hover:border-line-strong enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';

const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" disabled={!meta.hasPrevPage} onClick={() => onPageChange(meta.page - 1)} aria-label="Previous page" className={pageButtonClass}>
        <ChevronLeft size={16} />
      </button>

      {pageWindow(meta.page, meta.totalPages).map((page, index) =>
        page === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-subtle">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === meta.page ? 'page' : undefined}
            className={cn(pageButtonClass, page === meta.page && 'border-accent bg-accent text-white')}
          >
            {page}
          </button>
        ),
      )}

      <button type="button" disabled={!meta.hasNextPage} onClick={() => onPageChange(meta.page + 1)} aria-label="Next page" className={pageButtonClass}>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default Pagination;
