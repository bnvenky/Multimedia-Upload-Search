import { cn } from '../../utils/cn';

/**
 * Segmented control. options: [{ value, label?, icon?, ariaLabel? }]
 * mode 'radio' for a single choice setting (e.g. visibility), 'pressed' for toolbar toggles.
 */
const Segmented = ({ options, value, onChange, label, mode = 'pressed', wide = false, className }) => (
  <div
    role={mode === 'radio' ? 'radiogroup' : 'group'}
    aria-label={label}
    className={cn('inline-flex gap-0.5 rounded-xl border border-line bg-surface p-[3px]', wide && 'flex', className)}
  >
    {options.map(({ value: optionValue, label: optionLabel, icon: Icon, ariaLabel }) => {
      const active = optionValue === value;
      return (
        <button
          key={optionValue}
          type="button"
          {...(mode === 'radio' ? { role: 'radio', 'aria-checked': active } : { 'aria-pressed': active })}
          aria-label={ariaLabel}
          onClick={() => onChange(optionValue)}
          className={cn(
            'inline-flex h-7.5 items-center justify-center gap-1.5 rounded-lg px-3 text-[0.85rem] font-semibold text-muted transition hover:text-ink',
            wide && 'h-8.5 flex-1',
            active && 'bg-surface-hover text-ink shadow-soft',
          )}
        >
          {Icon && <Icon size={15} aria-hidden />}
          {optionLabel}
        </button>
      );
    })}
  </div>
);

export default Segmented;
