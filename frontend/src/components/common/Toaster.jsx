import { CircleCheck, CircleX, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectIsAuthenticated } from '../../store/authSlice';
import { dismissToast, selectToasts } from '../../store/toastsSlice';
import { cn } from '../../utils/cn';
import IconButton from './IconButton';

const TOAST_TYPES = {
  success: { icon: CircleCheck, className: 'text-success' },
  error: { icon: CircleX, className: 'text-danger' },
  info: { icon: Info, className: 'text-accent' },
};

const AUTO_DISMISS_MS = 5000;

const Toast = ({ toast }) => {
  const dispatch = useDispatch();
  const { icon: Icon, className } = TOAST_TYPES[toast.type] ?? TOAST_TYPES.info;
  const close = () => dispatch(dismissToast(toast.id));

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className="flex animate-fade-in items-start gap-3 rounded-xl border border-line-strong bg-elevated p-3.5 shadow-float"
    >
      <Icon size={20} className={cn('mt-px shrink-0', className)} aria-hidden />
      <div className="min-w-0 flex-1 text-[0.88rem]">
        {toast.title && <strong className="font-semibold">{toast.title}</strong>}
        {toast.message && <p className="mt-0.5 text-muted">{toast.message}</p>}
        {toast.link && (
          <Link to={toast.link} onClick={close} className="mt-1.5 inline-block font-semibold text-accent">
            View
          </Link>
        )}
      </div>
      <IconButton size="sm" onClick={close} aria-label="Dismiss notification">
        <X size={16} />
      </IconButton>
    </div>
  );
};

/** All notifications (errors, successes, real-time events) appear top-right; below the top bar when signed in. */
const Toaster = () => {
  const toasts = useSelector(selectToasts);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div
      aria-live="polite"
      className={cn('fixed right-4 z-200 grid w-[min(380px,calc(100vw-32px))] gap-2.5', isAuthenticated ? 'top-20' : 'top-4')}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default Toaster;
