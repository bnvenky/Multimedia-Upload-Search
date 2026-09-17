import { RotateCcw, TriangleAlert } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

const StateIcon = ({ icon: Icon, tone = 'accent' }) => (
  <div
    className={cn(
      'mb-2 grid size-16 place-items-center rounded-[18px]',
      tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-brand-soft text-accent',
    )}
  >
    <Icon size={28} aria-hidden />
  </div>
);

export const EmptyState = ({ icon, title, message, action }) => (
  <div className="grid justify-items-center gap-2 px-4 py-16 text-center">
    {icon && <StateIcon icon={icon} />}
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    {message && <p className="max-w-md text-muted">{message}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <div role="alert" className="grid justify-items-center gap-2 px-4 py-16 text-center">
    <StateIcon icon={TriangleAlert} tone="danger" />
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    {message && <p className="max-w-md text-muted">{message}</p>}
    {onRetry && (
      <div className="mt-3">
        <Button variant="secondary" icon={RotateCcw} onClick={onRetry}>
          Try again
        </Button>
      </div>
    )}
  </div>
);

export const Skeleton = ({ className, style }) => <div className={cn('skeleton rounded-lg', className)} style={style} aria-hidden />;
