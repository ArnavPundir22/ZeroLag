import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PWAInstallBanner } from './components/ui/PWAInstallBanner';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRoutes />
        <PWAInstallBanner />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
