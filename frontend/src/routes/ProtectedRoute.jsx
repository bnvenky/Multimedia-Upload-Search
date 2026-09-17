import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '../store/authSlice';

/** Only signed-in users may enter; others go to /login and come back here afterwards. */
export const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
};

/** Login and register pages redirect away when the user is already signed in. */
export const GuestRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }
  return <Outlet />;
};
