import { useState } from 'react';
import { cn } from '../../utils/cn';
import { formatBytes, formatPercent } from '../../utils/format';
import { MEDIA_CATEGORIES, MEDIA_TYPES } from '../../utils/media';

const Swatch = ({ category }) => <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', MEDIA_TYPES[category].tone.fill)} />;

/**
 * Part-to-whole view of storage by media type: one thin stacked bar (hover or focus a segment
 * for details) plus a table that labels every value, so nothing depends on color or the tooltip
 * alone. Categories keep a fixed order, so each media type always keeps its color.
 */
const StorageBreakdown = ({ stats }) => {
  const [active, setActive] = useState(null);

  const rows = MEDIA_CATEGORIES.map((category) => {
    const { count, bytes } = stats.byCategory[category] ?? { count: 0, bytes: 0 };
    return { category, label: MEDIA_TYPES[category].plural, count, bytes, share: stats.totalBytes > 0 ? bytes / stats.totalBytes : 0 };
  });

  // Each segment starts where the previous one ended (used to position the tooltip).
  const segments = rows
    .filter((row) => row.bytes > 0)
    .reduce((list, row) => {
      const previous = list.at(-1);
      return [...list, { ...row, start: previous ? previous.start + previous.share : 0 }];
    }, []);
  const activeSegment = segments.find((segment) => segment.category === active);

  return (
    <div className="grid gap-4.5">
      <div className="relative pt-1.5">
        <div
          role="img"
          aria-label={`Storage by type: ${segments.map((row) => `${row.label} ${formatPercent(row.share)}`).join(', ')}`}
          className="flex h-4.5 gap-0.5 overflow-hidden rounded bg-surface"
        >
          {segments.map((segment) => (
            <div
              key={segment.category}
              tabIndex={0}
              aria-label={`${segment.label}: ${formatBytes(segment.bytes)}, ${formatPercent(segment.share)}`}
              onMouseEnter={() => setActive(segment.category)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(segment.category)}
              onBlur={() => setActive(null)}
              style={{ flexGrow: segment.share }}
              className={cn(
                'h-full min-w-1 cursor-pointer transition-opacity focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink',
                MEDIA_TYPES[segment.category].tone.fill,
                active && active !== segment.category && 'opacity-35',
              )}
            />
          ))}
        </div>

        {activeSegment && (
          <div
            role="tooltip"
            style={{ left: `${(activeSegment.start + activeSegment.share / 2) * 100}%` }}
            className="pointer-events-none absolute bottom-[calc(100%+6px)] z-10 grid -translate-x-1/2 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 rounded-lg border border-line-strong bg-elevated px-2.5 py-2 text-[0.78rem] whitespace-nowrap shadow-card"
          >
            <Swatch category={activeSegment.category} />
            <strong className="font-semibold">{activeSegment.label}</strong>
            <span className="col-start-2 text-muted tabular-nums">
              {formatBytes(activeSegment.bytes)} · {formatPercent(activeSegment.share)} · {activeSegment.count} files
            </span>
          </div>
        )}
      </div>

      <table className="w-full border-collapse text-[0.86rem]">
        <caption className="sr-only">Storage used per media type</caption>
        <thead>
          <tr className="text-[0.74rem] tracking-wide text-subtle uppercase">
            <th scope="col" className="border-b border-line px-1.5 py-2 text-left font-semibold">
              Type
            </th>
            {['Files', 'Size', 'Share'].map((heading) => (
              <th key={heading} scope="col" className="border-b border-line px-1.5 py-2 text-right font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.category}
              onMouseEnter={() => row.bytes > 0 && setActive(row.category)}
              onMouseLeave={() => setActive(null)}
              className={cn('[&>*]:border-b [&>*]:border-line last:[&>*]:border-b-0', active === row.category && 'bg-surface-2')}
            >
              <th scope="row" className="px-1.5 py-2 text-left font-medium">
                <span className="flex items-center gap-2">
                  <Swatch category={row.category} />
                  {row.label}
                </span>
              </th>
              <td className="px-1.5 py-2 text-right text-muted tabular-nums">{row.count}</td>
              <td className="px-1.5 py-2 text-right text-muted tabular-nums">{formatBytes(row.bytes)}</td>
              <td className="px-1.5 py-2 text-right text-muted tabular-nums">{formatPercent(row.share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StorageBreakdown;
