import { Hash, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSuggestionsQuery } from '../../hooks/useSearchQueries';
import { cn } from '../../utils/cn';
import { MEDIA_TYPES } from '../../utils/media';

const isTypingInField = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

/**
 * Global search box: updates `?q=` while typing (debounced), shows tag and title autocomplete,
 * supports ↑ ↓ Enter Escape, and "/" or Ctrl+K focuses it from anywhere.
 */
const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const onLibrary = location.pathname === '/';
  const urlQuery = onLibrary ? (searchParams.get('q') ?? '') : '';

  const [value, setValue] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listId = useId();

  const debounced = useDebouncedValue(value.trim(), 300);
  const { data: suggestions } = useSuggestionsQuery(debounced);

  // Sync the input when the URL changes from outside (back button, tag click, clear filters),
  // but not when the change came from our own debounced typing, or newer keystrokes would be lost.
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    if (urlQuery !== debounced) setValue(urlQuery);
  }

  const options = [
    ...(suggestions?.tags ?? []).map((tag) => ({ key: `tag-${tag.tag}`, kind: 'tag', label: tag.tag, meta: `${tag.count} files` })),
    ...(suggestions?.files ?? []).map((file) => ({
      key: `file-${file.id}`,
      kind: 'file',
      label: file.title,
      id: file.id,
      category: file.category,
      meta: MEDIA_TYPES[file.category]?.label,
    })),
  ];

  const runSearch = (query) => {
    const next = new URLSearchParams(onLibrary ? searchParams : undefined);
    if (query.trim()) next.set('q', query.trim());
    else next.delete('q');
    next.delete('page');
    next.delete('sort');
    navigate({ pathname: '/', search: next.toString() }, { replace: onLibrary });
  };

  // Live results while typing on the library page.
  useEffect(() => {
    if (onLibrary && debounced !== urlQuery.trim()) runSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    const handleShortcut = (event) => {
      const slash = event.key === '/' && !isTypingInField();
      const commandK = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
      if (slash || commandK) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const choose = (option) => {
    setOpen(false);
    setActiveIndex(-1);
    if (option.kind === 'file') {
      navigate(`/files/${option.id}`);
    } else {
      setValue('');
      navigate(`/?tags=${encodeURIComponent(option.label)}`);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' && options.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === 'ArrowUp' && options.length) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (open && options[activeIndex]) {
        choose(options[activeIndex]);
      } else {
        setOpen(false);
        runSearch(value);
      }
    } else if (event.key === 'Escape' && showSuggestions) {
      // First Escape only closes the suggestions (search inputs would otherwise clear themselves).
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showSuggestions = open && debounced.length >= 2 && options.length > 0;

  return (
    <div role="search" className="relative flex max-w-155 flex-1 items-center">
      <Search size={18} className="pointer-events-none absolute left-3.5 text-subtle" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder="Search files, tags, descriptions…"
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        aria-label="Search files"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className="h-10.5 w-full rounded-xl border border-line bg-surface pr-10 pl-10.5 text-ink transition placeholder:text-subtle focus:border-accent focus:ring-[3px] focus:ring-accent-soft focus:outline-none"
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('');
            runSearch('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-2.5 grid size-6 place-items-center rounded-full bg-surface-2 text-muted hover:text-ink"
        >
          <X size={16} />
        </button>
      ) : (
        <kbd className="absolute right-2.5 grid h-5.5 min-w-5.5 place-items-center rounded-md border border-line-strong px-1.5 font-sans text-xs text-subtle max-sm:hidden">
          /
        </kbd>
      )}

      {showSuggestions && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 animate-fade-in rounded-xl border border-line-strong bg-elevated p-1.5 shadow-float"
        >
          {options.map((option, index) => {
            const Icon = option.kind === 'tag' ? Hash : (MEDIA_TYPES[option.category]?.icon ?? Search);
            const active = index === activeIndex;
            return (
              <li
                key={option.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={active}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-muted', active && 'bg-surface-2 text-ink')}
              >
                <Icon size={16} aria-hidden className={option.kind === 'file' ? MEDIA_TYPES[option.category]?.tone.text : undefined} />
                <span className="flex-1 truncate text-ink">{option.label}</span>
                <span className="text-xs text-subtle">{option.meta}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
