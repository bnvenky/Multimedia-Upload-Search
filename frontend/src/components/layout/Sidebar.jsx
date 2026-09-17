import { CloudUpload, FolderOpen, LayoutDashboard, Library, LogOut, MonitorSmartphone } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLogoutAllMutation, useLogoutMutation } from '../../hooks/useAuthMutations';
import { useStatsQuery } from '../../hooks/useFileQueries';
import { selectCurrentUser } from '../../store/authSlice';
import { selectActiveUploadCount } from '../../store/uploadsSlice';
import { selectSidebarOpen, sidebarToggled } from '../../store/uiSlice';
import { cn } from '../../utils/cn';
import { formatBytes } from '../../utils/format';
import Logo from '../common/Logo';

const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB display quota

const navItemClass = (active) =>
  cn(
    'flex h-10.5 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.93rem] font-medium text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-60',
    active && 'bg-accent-soft text-ink [&>svg]:text-accent',
  );

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const open = useSelector(selectSidebarOpen);
  const activeUploads = useSelector(selectActiveUploadCount);
  const { data: stats } = useStatsQuery();
  const logout = useLogoutMutation();
  const logoutAll = useLogoutAllMutation();

  const onLibrary = location.pathname === '/';
  const isMine = new URLSearchParams(location.search).get('scope') === 'mine';
  const close = () => dispatch(sidebarToggled(false));
  const usedPercent = Math.min(100, ((stats?.totalBytes ?? 0) / STORAGE_QUOTA_BYTES) * 100);

  const navItems = [
    { to: '/', label: 'Explore', icon: Library, active: onLibrary && !isMine },
    { to: '/?scope=mine', label: 'My files', icon: FolderOpen, active: onLibrary && isMine },
    { to: '/upload', label: 'Upload', icon: CloudUpload, badge: activeUploads || null },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      <aside
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-4.5 overflow-y-auto border-r border-line bg-elevated px-3.5 py-5 transition-transform duration-200',
          'max-md:shadow-float',
          open ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}
      >
        <Link to="/" onClick={close} className="rounded-xl px-2 pt-1 pb-2">
          <Logo />
        </Link>

        <nav className="grid gap-1">
          {navItems.map(({ to, label, icon: Icon, active, badge }) => (
            <NavLink key={label} to={to} end onClick={close} className={({ isActive }) => navItemClass(active ?? isActive)}>
              <Icon size={19} aria-hidden />
              <span>{label}</span>
              {badge && <span className="ml-auto grid h-5.5 min-w-5.5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">{badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto grid gap-2 rounded-xl border border-line bg-brand-soft p-3.5 text-[0.8rem]">
          <div className="flex justify-between text-muted">
            <span>Your storage</span>
            <strong className="text-ink">{formatBytes(stats?.totalBytes ?? 0)}</strong>
          </div>
          <div role="meter" aria-label="Storage used" aria-valuenow={Math.round(usedPercent)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(usedPercent, 2)}%` }} />
          </div>
          <p className="text-[0.76rem] text-muted">
            {stats?.totalFiles ?? 0} files · {formatBytes(STORAGE_QUOTA_BYTES)} plan
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-1.5">
          <div aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="grid min-w-0">
            <strong className="truncate text-[0.9rem]">{user?.name}</strong>
            <span className="truncate text-[0.76rem] text-subtle">{user?.email}</span>
          </div>
        </div>

        <div className="grid gap-0.5">
          <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending} className={navItemClass(false)}>
            <LogOut size={18} aria-hidden />
            <span>{logout.isPending ? 'Signing out…' : 'Sign out'}</span>
          </button>
          <button type="button" onClick={() => logoutAll.mutate()} disabled={logoutAll.isPending} className={cn(navItemClass(false), 'h-9 text-[0.82rem] text-subtle')}>
            <MonitorSmartphone size={18} aria-hidden />
            <span>Sign out everywhere</span>
          </button>
        </div>
      </aside>

      {open && <div aria-hidden onClick={close} className="fixed inset-0 z-35 bg-backdrop md:hidden" />}
    </>
  );
};

export default Sidebar;
