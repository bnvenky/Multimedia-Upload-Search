import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import IconButton from './IconButton';

const Modal = ({ open, title, onClose, children, footer, size = 'md' }) => {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 grid animate-fade-in place-items-center bg-backdrop p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'flex max-h-[calc(100vh-32px)] w-full animate-pop flex-col rounded-3xl border border-line-strong bg-elevated shadow-float outline-none',
          size === 'sm' ? 'max-w-105' : 'max-w-140',
        )}
      >
        <header className="flex items-center justify-between px-5 pt-4.5 pb-2.5">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <IconButton onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </IconButton>
        </header>
        <div className="overflow-y-auto px-5 pt-2 pb-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
