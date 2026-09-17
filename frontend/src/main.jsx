import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { connectAuth } from './api/httpClient';
import { queryClient } from './api/queryClient';
import { refreshSession } from './api/session';
import App from './App';
import { store } from './store';
import { connectNotifier } from './store/notifier';
import './styles/theme.scss';
import './styles/index.css';

// Toasts can be shown from anywhere (query callbacks, thunks) through the shared notifier.
connectNotifier(store.dispatch);

// The API client reads the access token from Redux and refreshes it through Redux.
connectAuth({
  getAccessToken: () => store.getState().auth.accessToken,
  refreshSession: () => refreshSession(store.dispatch),
});

// Devtools are downloaded only in development builds.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((module) => ({ default: module.ReactQueryDevtools })))
  : () => null;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Suspense fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-right" />
        </Suspense>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
