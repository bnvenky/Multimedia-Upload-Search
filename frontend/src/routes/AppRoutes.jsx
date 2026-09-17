import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import SplashScreen from '../components/common/SplashScreen';
import AppLayout from '../components/layout/AppLayout';
import { GuestRoute, ProtectedRoute } from './ProtectedRoute';

// Each page is a separate JavaScript chunk, downloaded the first time it is visited.
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const LibraryPage = lazy(() => import('../pages/LibraryPage'));
const UploadPage = lazy(() => import('../pages/UploadPage'));
const FileDetailsPage = lazy(() => import('../pages/FileDetailsPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AppRoutes = () => (
  <Suspense fallback={<SplashScreen />}>
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<LibraryPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="files/:id" element={<FileDetailsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
