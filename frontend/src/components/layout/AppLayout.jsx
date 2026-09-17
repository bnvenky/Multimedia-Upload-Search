import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useRealtime } from '../../hooks/useRealtime';
import { Skeleton } from '../common/StateViews';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  useRealtime();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="min-w-0 md:ml-64">
        <Topbar />
        <main id="main-content" className="mx-auto w-full max-w-370 px-4 pt-6 pb-16 md:px-8 md:pt-7 md:pb-18">
          <Suspense fallback={<Skeleton className="h-[60vh] rounded-[18px]" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
