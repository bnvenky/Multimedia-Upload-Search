import { Hash } from 'lucide-react';
import { usePopularTagsQuery } from '../../hooks/useSearchQueries';
import Chip from '../common/Chip';

const PopularTags = ({ scope, selected = [], onSelect }) => {
  const { data: tags = [] } = usePopularTagsQuery({ scope, limit: 12 });
  if (tags.length === 0) return null;

  return (
    <div aria-label="Popular tags" className="mb-5 flex min-w-0 items-center gap-2.5">
      <span className="inline-flex shrink-0 items-center gap-1 text-[0.78rem] font-semibold text-subtle">
        <Hash size={14} aria-hidden /> Trending tags
      </span>
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-0.5">
        {tags.map(({ tag, count }) => {
          const active = selected.includes(tag);
          return (
            <Chip key={tag} size="sm" active={active} aria-pressed={active} onClick={() => onSelect(tag)}>
              #{tag} <span className="text-subtle tabular-nums">{count}</span>
            </Chip>
          );
        })}
      </div>
    </div>
  );
};

export default PopularTags;
