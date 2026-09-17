import { X } from 'lucide-react';
import { useId, useState } from 'react';
import { labelClass } from '../../utils/styles';
import { mergeTags } from '../../utils/tags';

const MAX_TAGS = 15;

/** Chip-style tag editor: Enter or comma adds a tag, Backspace on an empty input removes the last one. */
const TagInput = ({ label = 'Tags', value = [], onChange, placeholder = 'Add a tag and press Enter' }) => {
  const id = useId();
  const [draft, setDraft] = useState('');
  const limitReached = value.length >= MAX_TAGS;

  const addTags = (raw) => {
    const next = mergeTags(value, raw, MAX_TAGS);
    if (next.length !== value.length) onChange(next);
    setDraft('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTags(draft);
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="flex min-h-10.5 flex-wrap items-center gap-1.5 rounded-xl border border-line-strong bg-elevated px-2 py-1.5 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft">
        {value.map((tag) => (
          <span key={tag} className="inline-flex h-7 items-center gap-1 rounded-full bg-surface-2 pr-1.5 pl-2.5 text-[0.82rem] text-ink">
            #{tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              aria-label={`Remove tag ${tag}`}
              className="grid size-4.5 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-ink"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTags(draft)}
          placeholder={limitReached ? 'Tag limit reached' : placeholder}
          disabled={limitReached}
          className="min-w-30 flex-1 bg-transparent p-1 outline-none placeholder:text-subtle"
        />
      </div>
    </div>
  );
};

export default TagInput;
