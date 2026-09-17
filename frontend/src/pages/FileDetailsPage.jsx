import { ArrowLeft, Calendar, Clock, Copy, Eye, FileQuestion, FileText, Globe, HardDrive, Image, Lock, Pencil, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, CategoryBadge } from '../components/common/Badge';
import Button from '../components/common/Button';
import Chip from '../components/common/Chip';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '../components/common/StateViews';
import EditFileModal from '../components/files/EditFileModal';
import MediaPreview from '../components/files/MediaPreview';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDeleteFileMutation, useFileQuery } from '../hooks/useFileQueries';
import { selectCurrentUser } from '../store/authSlice';
import { notify } from '../store/notifier';
import { cn } from '../utils/cn';
import { getErrorMessage } from '../utils/errors';
import { formatBytes, formatCount, formatDateTime, formatDuration, formatRelativeTime } from '../utils/format';
import { cardClass } from '../utils/styles';

const DetailRow = ({ icon: Icon, label, children }) => (
  <div className="flex justify-between gap-3 border-b border-line py-2.5 text-[0.88rem]">
    <dt className="inline-flex items-center gap-2 text-subtle">
      <Icon size={15} aria-hidden /> {label}
    </dt>
    <dd className="text-right font-medium">{children}</dd>
  </div>
);

const FileDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { data: file, isPending, error, refetch } = useFileQuery(id);
  const deleteFile = useDeleteFileMutation();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useDocumentTitle(file?.title ?? 'File');

  if (isPending) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[60vh] rounded-3xl" />
        <Skeleton className="h-80 rounded-[18px]" />
      </div>
    );
  }

  if (error?.status === 404 || error?.status === 400) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="File not found"
        message="It may have been deleted, made private, or the link is incorrect."
        action={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/')}>
            Back to library
          </Button>
        }
      />
    );
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const canManage = user && (user.id === file.owner.id || user.role === 'admin');
  const dimensions = file.width && file.height ? `${file.width} × ${file.height}` : null;

  const copyLink = async () => {
    // A link to the file's page in this app — not the raw Cloudinary URL. That direct URL
    // (a) bypasses this app's sign-in and private/public rules entirely, and (b) fails outright
    // for PDFs on accounts that restrict direct PDF delivery (this one included). The in-app
    // link always works and always respects who is allowed to see the file.
    const shareUrl = `${window.location.origin}/files/${file.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify.success('Link copied', 'Anyone signed in with access to this file can open it.');
    } catch {
      notify.error('Could not copy the link', 'Your browser blocked clipboard access.');
    }
  };

  const confirmDelete = () =>
    deleteFile.mutate(file.id, {
      onSuccess: () => {
        notify.success('File deleted', file.title);
        navigate('/', { replace: true });
      },
      // The error itself is shown as a toast by the global mutation error handler.
      onError: () => setConfirmingDelete(false),
    });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <Link to="/" className="mb-3.5 inline-flex items-center gap-1.5 rounded-md text-[0.88rem] font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> Library
        </Link>
        <MediaPreview file={file} />
      </div>

      <aside className={cn(cardClass, 'grid gap-3.5 p-5 lg:sticky lg:top-22 lg:mt-8.5')}>
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={file.category} />
          <Badge className="text-muted">
            {file.visibility === 'private' ? <Lock size={12} aria-hidden /> : <Globe size={12} aria-hidden />}
            {file.visibility === 'private' ? 'Private' : 'Public'}
          </Badge>
        </div>

        <h1 className="text-[1.45rem] leading-tight font-bold tracking-tight [overflow-wrap:anywhere]">{file.title}</h1>
        {file.description && <p className="whitespace-pre-line text-muted">{file.description}</p>}

        {file.tags.length > 0 && (
          <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
            {file.tags.map((tag) => (
              <li key={tag}>
                <Chip as={Link} to={`/?tags=${encodeURIComponent(tag)}`}>
                  #{tag}
                </Chip>
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-1 grid border-t border-line">
          <DetailRow icon={User} label="Owner">
            {file.owner.name}
          </DetailRow>
          <DetailRow icon={Calendar} label="Uploaded">
            <span title={formatDateTime(file.createdAt)}>{formatRelativeTime(file.createdAt)}</span>
          </DetailRow>
          <DetailRow icon={Eye} label="Views">
            {formatCount(file.views)}
          </DetailRow>
          <DetailRow icon={HardDrive} label="Size">
            {formatBytes(file.size)} · {file.extension.toUpperCase()}
          </DetailRow>
          {dimensions && (
            <DetailRow icon={Image} label="Dimensions">
              {dimensions}
            </DetailRow>
          )}
          {file.duration ? (
            <DetailRow icon={Clock} label="Duration">
              {formatDuration(file.duration)}
            </DetailRow>
          ) : null}
          {file.pages ? (
            <DetailRow icon={FileText} label="Pages">
              {file.pages}
            </DetailRow>
          ) : null}
        </dl>

        <p title={file.originalName} className="truncate text-[0.78rem] text-subtle">
          {file.originalName}
        </p>

        <div className="flex flex-wrap gap-2 [&>button]:flex-1">
          <Button variant="secondary" icon={Copy} onClick={copyLink}>
            Copy link
          </Button>
          {canManage && (
            <>
              <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" icon={Trash2} onClick={() => setConfirmingDelete(true)}>
                Delete
              </Button>
            </>
          )}
        </div>
      </aside>

      {editing && <EditFileModal file={file} onClose={() => setEditing(false)} />}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this file?"
        message={`“${file.title}” will be permanently removed from cloud storage and the library.`}
        confirmLabel="Delete file"
        danger
        loading={deleteFile.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
};

export default FileDetailsPage;
