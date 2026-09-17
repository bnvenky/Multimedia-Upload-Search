import { cn } from '../../utils/cn';
import { cardClass } from '../../utils/styles';
import { Skeleton } from '../common/StateViews';
import FileCard from './FileCard';

const gridClass = (layout) =>
  cn('grid', layout === 'list' ? 'grid-cols-1 gap-2.5' : 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4.5');

export const FileGridSkeleton = ({ count = 8, layout = 'grid' }) => (
  <div aria-busy="true" aria-label="Loading files" className={gridClass(layout)}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={cn(cardClass, 'overflow-hidden', layout === 'list' ? 'flex' : 'flex flex-col')}>
        <Skeleton className={cn('rounded-none', layout === 'list' ? 'h-27.5 w-45' : 'aspect-16/10')} />
        <div className="grid flex-1 gap-2 p-3.5">
          <Skeleton className="h-4.5 w-2/5" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      </div>
    ))}
  </div>
);

const FileGrid = ({ files, terms, layout = 'grid' }) => (
  <div className={gridClass(layout)}>
    {files.map((file) => (
      <FileCard key={file.id} file={file} terms={terms} layout={layout} />
    ))}
  </div>
);

export default FileGrid;
