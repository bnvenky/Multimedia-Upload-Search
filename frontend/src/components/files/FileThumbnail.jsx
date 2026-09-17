import { Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { formatDuration } from '../../utils/format';
import { MEDIA_TYPES } from '../../utils/media';

const overlayBadgeClass = 'absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[0.72rem] font-semibold text-white tabular-nums';

/** Category-aware preview image: image crop, video frame + play badge, audio waveform, PDF first page. */
const FileThumbnail = ({ file, className }) => {
  const [failed, setFailed] = useState(false);
  const type = MEDIA_TYPES[file.category] ?? MEDIA_TYPES.image;
  const Icon = type.icon;

  return (
    <div className={cn('group/thumb relative aspect-16/10 overflow-hidden bg-linear-to-br via-surface-2 to-surface-2', type.tone.glow, type.tone.text, className)}>
      {file.thumbnailUrl && !failed ? (
        <img
          src={file.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn(
            'size-full transition-transform duration-500 group-hover/card:scale-[1.04]',
            // Waveforms are wide and transparent: show them whole instead of cropping.
            file.category === 'audio' ? 'object-contain p-4.5' : 'object-cover',
          )}
        />
      ) : (
        <div className="grid size-full place-items-center">
          <Icon size={36} aria-hidden />
        </div>
      )}

      {file.category === 'video' && (
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 grid size-11 -translate-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform duration-200 group-hover/card:scale-110"
        >
          <Play size={18} fill="currentColor" />
        </span>
      )}

      {file.duration ? <span className={overlayBadgeClass}>{formatDuration(file.duration)}</span> : null}
      {file.category === 'pdf' && file.pages ? (
        <span className={overlayBadgeClass}>
          {file.pages} {file.pages === 1 ? 'page' : 'pages'}
        </span>
      ) : null}
    </div>
  );
};

export default FileThumbnail;
