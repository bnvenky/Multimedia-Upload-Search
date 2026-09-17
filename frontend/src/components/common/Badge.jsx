import { cn } from '../../utils/cn';
import { MEDIA_TYPES } from '../../utils/media';

export const Badge = ({ className, children, ...rest }) => (
  <span
    className={cn(
      'inline-flex h-5.5 items-center gap-1.5 rounded-full bg-surface-2 px-2 text-[0.72rem] font-semibold tracking-wide whitespace-nowrap text-ink',
      className,
    )}
    {...rest}
  >
    {children}
  </span>
);

/** The category is identified by the colored icon; the label keeps the text color for contrast. */
export const CategoryBadge = ({ category }) => {
  const type = MEDIA_TYPES[category];
  if (!type) return null;
  const Icon = type.icon;

  return (
    <Badge className={type.tone.soft}>
      <Icon size={12} className={type.tone.text} aria-hidden />
      {type.label}
    </Badge>
  );
};
