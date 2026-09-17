import { cn } from '../../utils/cn';

const SIZES = {
  md: 'size-9.5 rounded-xl',
  sm: 'size-7.5 rounded-lg',
};

/** Square icon-only button. Always pass an `aria-label`. */
const IconButton = ({ size = 'md', className, children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={cn(
      'inline-grid shrink-0 place-items-center text-muted transition enabled:hover:bg-surface-2 enabled:hover:text-ink disabled:opacity-50',
      SIZES[size],
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export default IconButton;
