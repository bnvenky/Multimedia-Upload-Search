import { CloudUpload, Menu, Moon, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectRealtimeStatus, selectTheme, sidebarToggled, themeToggled } from '../../store/uiSlice';
import { cn } from '../../utils/cn';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import SearchBar from '../search/SearchBar';

const LIVE_STATUS = {
  live: { label: 'Live', dot: 'bg-success animate-live' },
  connecting: { label: 'Connecting', dot: 'bg-warning' },
  offline: { label: 'Offline', dot: 'bg-subtle' },
};

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(selectTheme);
  const realtime = LIVE_STATUS[useSelector(selectRealtimeStatus)];

  return (
    <header className="sticky top-0 z-30 flex h-17 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-md md:px-8">
      <IconButton onClick={() => dispatch(sidebarToggled())} aria-label="Open navigation" className="md:hidden">
        <Menu size={20} />
      </IconButton>

      <SearchBar />

      <div className="ml-auto flex items-center gap-2">
        <span title="Real-time updates" className="inline-flex h-7.5 items-center gap-2 rounded-full border border-line px-2.5 text-[0.76rem] font-semibold text-muted max-sm:hidden">
          <span aria-hidden className={cn('size-2 rounded-full', realtime.dot)} />
          <span className="max-lg:sr-only">{realtime.label}</span>
        </span>
        <IconButton onClick={() => dispatch(themeToggled())} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </IconButton>
        <Button icon={CloudUpload} onClick={() => navigate('/upload')} className="max-sm:px-2.5 max-sm:[&>span]:hidden">
          Upload
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
