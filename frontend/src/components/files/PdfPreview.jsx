import { ExternalLink, FileText, LoaderCircle } from 'lucide-react';
import { useDownloadUrlQuery } from '../../hooks/useFileQueries';

/**
 * PDF viewer built from page images rendered by Cloudinary. Page images are delivered even when
 * the Cloudinary account blocks direct PDF delivery (HTTP 401), so the preview always works.
 * "Open original" uses a short-lived signed link from the API.
 */
const PdfPreview = ({ file }) => {
  const pages = file.previewPages?.length ? file.previewPages : [file.thumbnailUrl].filter(Boolean);
  const totalPages = file.pages ?? pages.length;
  const download = useDownloadUrlQuery(file.id);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <FileText size={16} className="text-cat-pdf" aria-hidden />
          {totalPages} {totalPages === 1 ? 'page' : 'pages'}
        </span>

        {download.data?.url ? (
          <a
            href={download.data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-[0.85rem] font-semibold text-ink transition hover:border-line-strong hover:bg-surface-hover"
          >
            <ExternalLink size={15} aria-hidden /> Open original PDF
          </a>
        ) : (
          <span className="inline-flex h-8 items-center gap-2 px-3 text-[0.85rem] text-subtle">
            {download.isPending && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
            {download.isPending ? 'Preparing original…' : 'Original unavailable'}
          </span>
        )}
      </div>

      <div className="grid max-h-[76vh] justify-items-center gap-5 overflow-y-auto bg-surface-2 p-4 sm:p-6">
        {pages.map((src, index) => (
          <figure key={src} className="w-full max-w-3xl">
            <img
              src={src}
              alt={`Page ${index + 1} of ${file.title}`}
              loading={index < 2 ? 'eager' : 'lazy'}
              className="w-full rounded-md bg-white shadow-card"
            />
            <figcaption className="mt-2 text-center text-xs text-subtle">
              Page {index + 1} of {totalPages}
            </figcaption>
          </figure>
        ))}
        {totalPages > pages.length && (
          <p className="text-sm text-muted">Showing the first {pages.length} pages — open the original to read the rest.</p>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
