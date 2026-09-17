import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession } from './api/session';
import SplashScreen from './components/common/SplashScreen';
import Toaster from './components/common/Toaster';
import { useThemeEffect } from './hooks/useThemeEffect';
import AppRoutes from './routes/AppRoutes';
import { selectAuthStatus } from './store/authSlice';

const App = () => {
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuthStatus);
  useThemeEffect();

  // On first load, silently restore the session from the HTTP-only refresh cookie.
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (authStatus === 'idle' || authStatus === 'checking') {
    return <SplashScreen />;
  }

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
};

export default App;
