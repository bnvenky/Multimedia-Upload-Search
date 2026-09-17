import { CloudUpload } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { ACCEPT_ATTRIBUTE } from '../../utils/media';
import Button from '../common/Button';

const Dropzone = ({ onFiles }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (files.length > 0) onFiles(files);
  };

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        'grid justify-items-center gap-2.5 rounded-3xl border-2 border-dashed border-line-strong bg-brand-soft px-5 py-12 text-center transition duration-200',
        dragging && 'scale-[1.01] border-accent bg-accent-soft',
      )}
    >
      <div className="mb-1.5 grid size-16 place-items-center rounded-full bg-brand text-white shadow-[0_12px_30px_-10px_var(--accent)]">
        <CloudUpload size={30} aria-hidden />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">Drag & drop files here</h2>
      <p className="text-muted">Images up to 10 MB · Videos up to 100 MB · Audio up to 50 MB · PDFs up to 10 MB</p>
      <Button variant="secondary" className="mt-2" onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        aria-label="Choose files to upload"
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
};

export default Dropzone;
