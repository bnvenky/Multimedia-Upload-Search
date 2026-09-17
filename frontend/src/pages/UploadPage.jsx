import { CloudUpload } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../components/common/Button';
import TagInput from '../components/common/TagInput';
import PageHeader from '../components/layout/PageHeader';
import Dropzone from '../components/upload/Dropzone';
import PendingFileCard from '../components/upload/PendingFileCard';
import UploadQueue from '../components/upload/UploadQueue';
import VisibilityToggle from '../components/upload/VisibilityToggle';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { notify } from '../store/notifier';
import { startUpload } from '../store/uploadsSlice';
import { cn } from '../utils/cn';
import { formatBytes } from '../utils/format';
import { titleFromFileName, validateFile } from '../utils/media';
import { cardClass } from '../utils/styles';

let nextKey = 0;

const UploadPage = () => {
  useDocumentTitle('Upload');
  const dispatch = useDispatch();
  const [pending, setPending] = useState([]);
  const [defaultTags, setDefaultTags] = useState([]);
  const [defaultVisibility, setDefaultVisibility] = useState('public');

  const addFiles = (files) => {
    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      const { category, error } = validateFile(file);
      if (error) {
        rejected.push(`${file.name} — ${error}`);
        return;
      }
      nextKey += 1;
      accepted.push({
        key: nextKey,
        file,
        category,
        title: titleFromFileName(file.name),
        description: '',
        tags: defaultTags,
        visibility: defaultVisibility,
      });
    });

    setPending((current) => [...current, ...accepted]);
    if (rejected.length > 0) {
      notify.error(`${rejected.length} ${rejected.length === 1 ? 'file was' : 'files were'} skipped`, rejected.join(' · '));
    }
  };

  const applyDefaultsToAll = () =>
    setPending((current) => current.map((item) => ({ ...item, tags: [...new Set([...item.tags, ...defaultTags])], visibility: defaultVisibility })));

  const uploadAll = () => {
    pending.forEach((item) =>
      dispatch(
        startUpload({
          file: item.file,
          metadata: { title: item.title.trim(), description: item.description.trim(), tags: item.tags, visibility: item.visibility },
        }),
      ),
    );
    setPending([]);
  };

  const updateItem = (key, updated) => setPending((current) => current.map((entry) => (entry.key === key ? updated : entry)));
  const removeItem = (key) => setPending((current) => current.filter((entry) => entry.key !== key));
  const totalBytes = pending.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <div>
      <PageHeader
        title="Upload media"
        description="Files go straight to secure cloud storage. The server verifies each file's real type from its contents."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <Dropzone onFiles={addFiles} />

          {pending.length > 0 && (
            <section aria-label="Files ready to upload" className="grid gap-3">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  Ready to upload{' '}
                  <span className="text-[0.9rem] font-medium text-muted">
                    · {pending.length} {pending.length === 1 ? 'file' : 'files'} · {formatBytes(totalBytes)}
                  </span>
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPending([])}>
                    Clear
                  </Button>
                  <Button icon={CloudUpload} onClick={uploadAll}>
                    Upload {pending.length === 1 ? 'file' : `${pending.length} files`}
                  </Button>
                </div>
              </header>
              {pending.map((item) => (
                <PendingFileCard key={item.key} item={item} onChange={(updated) => updateItem(item.key, updated)} onRemove={() => removeItem(item.key)} />
              ))}
            </section>
          )}
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-22">
          <section className={cn(cardClass, 'grid gap-3.5 p-5')}>
            <h2 className="text-lg font-semibold tracking-tight">Defaults for new files</h2>
            <p className="text-[0.9rem] text-muted">Applied to files you add next. Use “Apply to all” for files already in the list.</p>
            <TagInput value={defaultTags} onChange={setDefaultTags} />
            <VisibilityToggle value={defaultVisibility} onChange={setDefaultVisibility} />
            {pending.length > 0 && (
              <Button variant="secondary" block onClick={applyDefaultsToAll}>
                Apply to all
              </Button>
            )}
          </section>
          <UploadQueue />
        </aside>
      </div>
    </div>
  );
};

export default UploadPage;
