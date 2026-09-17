import { LayoutGrid, List, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectViewMode, viewModeChanged } from '../../store/uiSlice';
import { cn } from '../../utils/cn';
import { MEDIA_CATEGORIES, MEDIA_TYPES } from '../../utils/media';
import { controlClass, linkButtonClass } from '../../utils/styles';
import Chip from '../common/Chip';
import Segmented from '../common/Segmented';

const VIEW_OPTIONS = [
  { value: 'grid', icon: LayoutGrid, ariaLabel: 'Grid view' },
  { value: 'list', icon: List, ariaLabel: 'List view' },
];

const FilterBar = ({ params, updateParams, clearFilters }) => {
  const dispatch = useDispatch();
  const viewMode = useSelector(selectViewMode);

  const toggleType = (category) =>
    updateParams({
      type: params.type.includes(category) ? params.type.filter((type) => type !== category) : [...params.type, category],
    });

  const hasFilters = params.type.length > 0 || params.tags.length > 0 || params.from || params.to;

  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Filter by type" className="flex flex-wrap items-center gap-2">
        <Chip active={params.type.length === 0} aria-pressed={params.type.length === 0} onClick={() => updateParams({ type: [] })}>
          All
        </Chip>
        {MEDIA_CATEGORIES.map((category) => {
          const { icon: Icon, plural, tone } = MEDIA_TYPES[category];
          const active = params.type.includes(category);
          return (
            <Chip key={category} aria-pressed={active} onClick={() => toggleType(category)} className={cn(active && ['text-ink', tone.activeChip])}>
              <Icon size={14} className={tone.text} aria-hidden />
              {plural}
            </Chip>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
        <label>
          <span className="sr-only">Sort by</span>
          <select value={params.sort} onChange={(event) => updateParams({ sort: event.target.value })} className={controlClass}>
            {params.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex items-center gap-1.5 max-sm:w-full">
          <label className="max-sm:flex-1">
            <span className="sr-only">Uploaded from</span>
            <input
              type="date"
              value={params.from}
              max={params.to || undefined}
              onChange={(event) => updateParams({ from: event.target.value })}
              className={cn(controlClass, 'w-35 max-sm:w-full')}
            />
          </label>
          <span aria-hidden className="text-subtle">
            –
          </span>
          <label className="max-sm:flex-1">
            <span className="sr-only">Uploaded until</span>
            <input
              type="date"
              value={params.to}
              min={params.from || undefined}
              onChange={(event) => updateParams({ to: event.target.value })}
              className={cn(controlClass, 'w-35 max-sm:w-full')}
            />
          </label>
        </div>

        <Segmented label="Layout" options={VIEW_OPTIONS} value={viewMode} onChange={(mode) => dispatch(viewModeChanged(mode))} />
      </div>

      {hasFilters && (
        <div className="flex w-full flex-wrap items-center gap-2">
          {params.tags.map((tag) => (
            <Chip key={tag} size="sm" active onClick={() => updateParams({ tags: params.tags.filter((item) => item !== tag) })} aria-label={`Remove tag filter ${tag}`}>
              #{tag} <X size={12} aria-hidden />
            </Chip>
          ))}
          <button type="button" onClick={clearFilters} className={linkButtonClass}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
