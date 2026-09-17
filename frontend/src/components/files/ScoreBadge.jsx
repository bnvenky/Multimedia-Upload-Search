import { Sparkles } from 'lucide-react';
import { formatPercent } from '../../utils/format';

const FIELD_LABELS = { tags: 'tag', title: 'title', name: 'file name', description: 'description' };

/** How well a search hit matched, with the ranking breakdown on hover or keyboard focus. */
const ScoreBadge = ({ score }) => {
  if (!score) return null;

  const rows = [
    { label: 'Relevance', value: score.relevance, weight: '70%' },
    { label: 'Popularity', value: score.popularity, weight: '20%' },
    { label: 'Freshness', value: score.freshness, weight: '10%' },
  ];
  const matchSummary = [...new Set(score.matches.map((match) => `${match.kind} ${FIELD_LABELS[match.field]}`))].slice(0, 3).join(', ');

  return (
    <span
      tabIndex={0}
      aria-label={`Match score ${formatPercent(score.total)}`}
      className="group/score relative inline-flex h-5.5 cursor-help items-center gap-1 rounded-full border border-accent/35 bg-brand-soft px-2 text-[0.72rem] font-bold text-ink"
    >
      <Sparkles size={13} className="text-accent" aria-hidden />
      {formatPercent(score.total)}

      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 grid w-62.5 -translate-x-1/2 translate-y-1 gap-2 rounded-xl border border-line-strong bg-elevated p-3 text-[0.78rem] font-medium text-ink opacity-0 shadow-float transition group-hover/score:translate-y-0 group-hover/score:opacity-100 group-focus-visible/score:translate-y-0 group-focus-visible/score:opacity-100"
      >
        <strong className="font-semibold">Why this result</strong>
        {rows.map((row) => (
          <span key={row.label} className="grid grid-cols-[1fr_70px_36px] items-center gap-2">
            <span>
              {row.label} <em className="text-subtle not-italic">×{row.weight}</em>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-accent" style={{ width: formatPercent(row.value) }} />
            </span>
            <span className="text-right tabular-nums">{formatPercent(row.value)}</span>
          </span>
        ))}
        {matchSummary && <span className="text-muted">Matched: {matchSummary}</span>}
      </span>
    </span>
  );
};

export default ScoreBadge;
