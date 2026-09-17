import { cn } from '../../utils/cn';
import PdfPreview from './PdfPreview';

const frameClass =
  'relative grid place-items-center overflow-hidden rounded-3xl border border-line bg-elevated bg-[radial-gradient(circle_at_50%_0%,var(--accent-soft),transparent_70%)]';

/** Plays or displays the file straight from Cloudinary. */
const MediaPreview = ({ file }) => {
  switch (file.category) {
    case 'image':
      return (
        <a href={file.url} target="_blank" rel="noopener noreferrer" title="Open full size" className={cn(frameClass, 'min-h-80 cursor-zoom-in')}>
          <img src={file.url} alt={file.title} className="max-h-[72vh] w-auto object-contain" />
        </a>
      );

    case 'video':
      return (
        <div className={cn(frameClass, 'bg-black')}>
          <video src={file.url} poster={file.thumbnailUrl ?? undefined} controls preload="metadata" playsInline className="max-h-[72vh] w-full">
            Your browser cannot play this video.
          </video>
        </div>
      );

    case 'audio':
      return (
        <div className={cn(frameClass, 'min-h-80 gap-6 px-6 py-12')}>
          {file.thumbnailUrl && <img src={file.thumbnailUrl} alt="" aria-hidden className="h-auto w-full max-w-160" />}
          <audio src={file.url} controls preload="metadata" className="w-full max-w-140">
            Your browser cannot play this audio file.
          </audio>
        </div>
      );

    case 'pdf':
      return <PdfPreview file={file} />;

    default:
      return null;
  }
};

export default MediaPreview;
