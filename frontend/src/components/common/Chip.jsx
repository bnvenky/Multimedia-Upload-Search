import { cn } from '../../utils/cn';

/** Pill used for filters and tags. Renders a <button> by default; pass `as={Link}` for navigation. */
const Chip = ({ as: Component = 'button', active = false, size = 'md', className, children, ...rest }) => (
  <Component
    {...(Component === 'button' && { type: 'button' })}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface font-medium whitespace-nowrap text-muted transition hover:border-line-strong hover:text-ink',
      size === 'sm' ? 'h-6.5 px-2.5 text-xs' : 'h-8 px-3 text-[0.84rem]',
      active && 'border-accent/45 bg-accent-soft text-ink',
      className,
    )}
    {...rest}
  >
    {children}
  </Component>
);

export default Chip;
