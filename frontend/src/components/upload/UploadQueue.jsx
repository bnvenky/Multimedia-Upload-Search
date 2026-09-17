import { CircleCheck, CircleX, LoaderCircle, RotateCcw, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { cancelUpload, finishedUploadsCleared, removeUpload, retryUpload, selectUploads } from '../../store/uploadsSlice';
import { cn } from '../../utils/cn';
import { formatBytes } from '../../utils/format';
import { MEDIA_TYPES } from '../../utils/media';
import { cardClass, linkButtonClass } from '../../utils/styles';
import IconButton from '../common/IconButton';

const STATUS = {
  queued: { label: 'Waiting…', className: 'text-muted', bar: 'bg-brand' },
  uploading: { label: 'Uploading', className: 'text-muted', bar: 'bg-brand', icon: LoaderCircle, spin: true },
  done: { label: 'Uploaded', className: 'text-success', bar: 'bg-success', icon: CircleCheck },
  error: { label: 'Failed', className: 'text-danger', bar: 'bg-subtle', icon: CircleX },
  canceled: { label: 'Canceled', className: 'text-muted', bar: 'bg-subtle' },
};

const UploadItem = ({ upload }) => {
  const dispatch = useDispatch();
  const type = MEDIA_TYPES[upload.category];
  const TypeIcon = type?.icon;
  const status = STATUS[upload.status];
  const StatusIcon = status.icon;
  const busy = upload.status === 'queued' || upload.status === 'uploading';
  const retryable = upload.status === 'error' || upload.status === 'canceled';

  return (
    <li className="flex items-center gap-2.5 rounded-xl bg-surface-2 p-2.5">
      <div className={cn('grid size-9 shrink-0 place-items-center rounded-lg', type?.tone.soft, type?.tone.text)}>{TypeIcon && <TypeIcon size={18} aria-hidden />}</div>

      <div className="grid min-w-0 flex-1 gap-1.5">
        <div className="flex items-center justify-between gap-2 text-[0.78rem]">
          <strong className="truncate text-[0.86rem]">{upload.title}</strong>
          <span className={cn('inline-flex shrink-0 items-center gap-1 tabular-nums', status.className)}>
            {StatusIcon && <StatusIcon size={14} className={cn(status.spin && 'animate-spin')} aria-hidden />}
            {status.label}
            {upload.status === 'uploading' && ` ${upload.progress}%`}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={`${upload.title} upload progress`}
          aria-valuenow={upload.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-[5px] overflow-hidden rounded-full bg-surface-hover"
        >
          <div className={cn('h-full rounded-full transition-[width] duration-200 ease-linear', status.bar)} style={{ width: `${upload.progress}%` }} />
        </div>

        <div className="flex items-center justify-between gap-2 text-[0.78rem]">
          <span className="shrink-0 whitespace-nowrap text-muted">{formatBytes(upload.size)}</span>
          {upload.error && <span className="line-clamp-2 text-right text-danger">{upload.error}</span>}
          {upload.status === 'done' && upload.fileId && (
            <Link to={`/files/${upload.fileId}`} className={linkButtonClass}>
              View file
            </Link>
          )}
        </div>
      </div>

      <div className="flex">
        {busy && (
          <IconButton size="sm" onClick={() => dispatch(cancelUpload(upload.id))} aria-label="Cancel upload">
            <X size={16} />
          </IconButton>
        )}
        {retryable && (
          <>
            <IconButton size="sm" onClick={() => dispatch(retryUpload(upload.id))} aria-label="Retry upload">
              <RotateCcw size={16} />
            </IconButton>
            <IconButton size="sm" onClick={() => dispatch(removeUpload(upload.id))} aria-label="Remove from list">
              <X size={16} />
            </IconButton>
          </>
        )}
      </div>
    </li>
  );
};

const UploadQueue = () => {
  const dispatch = useDispatch();
  const uploads = useSelector(selectUploads);
  if (uploads.length === 0) return null;

  const hasFinished = uploads.some((upload) => ['done', 'error', 'canceled'].includes(upload.status));

  return (
    <section aria-label="Upload progress" className={cn(cardClass, 'p-4')}>
      <header className="mb-2.5 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Uploads</h2>
        {hasFinished && (
          <button type="button" onClick={() => dispatch(finishedUploadsCleared())} className={linkButtonClass}>
            Clear finished
          </button>
        )}
      </header>
      <ul className="grid max-h-130 gap-2 overflow-y-auto">
        {uploads.map((upload) => (
          <UploadItem key={upload.id} upload={upload} />
        ))}
      </ul>
    </section>
  );
};

export default UploadQueue;
