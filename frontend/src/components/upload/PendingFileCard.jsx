import { Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatBytes } from '../../utils/format';
import { MEDIA_TYPES } from '../../utils/media';
import { cardClass } from '../../utils/styles';
import IconButton from '../common/IconButton';
import TagInput from '../common/TagInput';
import TextField from '../common/TextField';
import LocalImagePreview from './LocalImagePreview';
import VisibilityToggle from './VisibilityToggle';

/** One selected file with editable metadata, before it is uploaded. */
const PendingFileCard = ({ item, onChange, onRemove }) => {
  const { icon: Icon, label, tone } = MEDIA_TYPES[item.category];
  const setField = (key) => (value) => onChange({ ...item, [key]: value });

  return (
    <article className={cn(cardClass, 'flex gap-4 p-3.5 max-sm:flex-col')}>
      <div className={cn('grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl', tone.soft, tone.text)}>
        {item.category === 'image' ? <LocalImagePreview file={item.file} /> : <Icon size={28} aria-hidden />}
      </div>

      <div className="grid min-w-0 flex-1 gap-3">
        <div className="flex justify-between gap-2">
          <div className="grid min-w-0">
            <strong className="truncate">{item.file.name}</strong>
            <span className="text-[0.8rem] text-muted">
              {label} · {formatBytes(item.file.size)}
            </span>
          </div>
          <IconButton onClick={onRemove} aria-label={`Remove ${item.file.name}`}>
            <Trash2 size={17} />
          </IconButton>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <TextField label="Title" value={item.title} maxLength={120} onChange={(event) => setField('title')(event.target.value)} />
          <TextField label="Description" value={item.description} maxLength={1000} placeholder="Optional" onChange={(event) => setField('description')(event.target.value)} />
          <TagInput value={item.tags} onChange={setField('tags')} />
          <VisibilityToggle value={item.visibility} onChange={setField('visibility')} />
        </div>
      </div>
    </article>
  );
};

export default PendingFileCard;
