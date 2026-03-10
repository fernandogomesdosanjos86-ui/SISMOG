import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { GlobalModals } from './components/modals/GlobalModals';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TarefasNotificationProvider } from './features/geral/tarefas/context/TarefasNotificationContext';
import App from './App';

import './index.css';

// Initialize Sentry only in production
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: 'production',
  });
}

const LazyDevtools = import.meta.env.DEV
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : null;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <TarefasNotificationProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </BrowserRouter>
            <GlobalModals />
          </TarefasNotificationProvider>
        </ModalProvider>
      </AuthProvider>
      {LazyDevtools && (
        <React.Suspense fallback={null}>
          <LazyDevtools initialIsOpen={false} />
        </React.Suspense>
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
