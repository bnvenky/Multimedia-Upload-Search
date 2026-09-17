import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary: 'bg-brand text-white shadow-[0_8px_20px_-8px_var(--accent)] enabled:hover:-translate-y-px enabled:hover:brightness-110',
  secondary: 'border-line bg-surface-2 text-ink enabled:hover:border-line-strong enabled:hover:bg-surface-hover',
  ghost: 'text-muted enabled:hover:bg-surface-2 enabled:hover:text-ink',
  danger: 'border-danger/30 bg-danger/15 text-danger enabled:hover:bg-danger enabled:hover:text-white',
};

const SIZES = {
  sm: 'h-8 px-3 text-[0.85rem]',
  md: 'h-10 px-4 text-[0.92rem]',
  lg: 'h-12 px-5.5 text-base',
};

const Button = ({ variant = 'primary', size = 'md', icon: Icon, loading = false, block = false, className, children, disabled, type = 'button', ...rest }) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl border border-transparent font-semibold whitespace-nowrap transition select-none disabled:cursor-not-allowed disabled:opacity-55',
      VARIANTS[variant],
      SIZES[size],
      block && 'w-full',
      !children && 'aspect-square px-0',
      className,
    )}
    {...rest}
  >
    {loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : Icon && <Icon size={18} aria-hidden />}
    {children && <span>{children}</span>}
  </button>
);

export default Button;
