import { Eye, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { formatBytes, formatCount, formatRelativeTime } from '../../utils/format';
import { cardClass } from '../../utils/styles';
import { Badge, CategoryBadge } from '../common/Badge';
import Chip from '../common/Chip';
import Highlight from '../common/Highlight';
import FileThumbnail from './FileThumbnail';
import ScoreBadge from './ScoreBadge';

/** layout: 'grid' (card) | 'list' (row) */
const FileCard = ({ file, terms = [], layout = 'grid' }) => {
  const isList = layout === 'list';

  return (
    <article
      className={cn(
        cardClass,
        'group/card relative flex transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card',
        isList ? 'flex-row' : 'flex-col',
      )}
    >
      <Link
        to={`/files/${file.id}`}
        aria-label={`Open ${file.title}`}
        className={cn('block overflow-hidden focus-visible:-outline-offset-2', isList ? 'w-27.5 shrink-0 rounded-l-[18px] sm:w-45' : 'rounded-t-[18px]')}
      >
        <FileThumbnail file={file} className={cn(isList && 'aspect-auto h-full min-h-27.5')} />
      </Link>

      <div className={cn('grid min-w-0 gap-2 px-3.5 pt-3 pb-3.5', isList && 'flex-1 content-center')}>
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={file.category} />
          {file.visibility === 'private' && (
            <Badge className="text-muted" title="Only you can see this file">
              <Lock size={12} aria-hidden />
              Private
            </Badge>
          )}
          {file.score && <ScoreBadge score={file.score} />}
        </div>

        <h3 className="line-clamp-2 text-[0.98rem] leading-snug font-semibold">
          <Link to={`/files/${file.id}`} className="hover:text-accent">
            <Highlight text={file.title} terms={terms} />
          </Link>
        </h3>

        {file.tags.length > 0 && (
          <ul aria-label="Tags" className="flex flex-wrap gap-1">
            {file.tags.slice(0, 4).map((tag) => (
              <li key={tag}>
                <Chip as={Link} to={`/?tags=${encodeURIComponent(tag)}`} size="sm">
                  {/* One span keeps "#" and the highlighted word together inside the flex chip. */}
                  <span>
                    #<Highlight text={tag} terms={terms} />
                  </span>
                </Chip>
              </li>
            ))}
          </ul>
        )}

        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.76rem] text-subtle">
          <span className="inline-flex max-w-32.5 items-center gap-1.5 truncate text-muted">
            <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[0.66rem] font-bold text-white">
              {file.owner.name[0]?.toUpperCase()}
            </span>
            {file.owner.name}
          </span>
          <span title={new Date(file.createdAt).toLocaleString()}>{formatRelativeTime(file.createdAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Eye size={13} aria-hidden />
            {formatCount(file.views)}
          </span>
          <span>{formatBytes(file.size)}</span>
        </footer>
      </div>
    </article>
  );
};

export default FileCard;
