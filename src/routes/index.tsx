import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedApp } from '../features/auth/components/ProtectedApp';
import { AppLayout } from '../layouts/AppLayout';
import { Dashboard } from '../features/dashboard/components/Dashboard';
import { BoardRouteWrapper } from '../features/boards/routes/BoardView';
import { AboutPage } from '../features/misc/routes/AboutPage';
import { FaqPage } from '../features/misc/routes/FaqPage';
import { TermsPage } from '../features/misc/routes/TermsPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ProtectedApp>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/b/:boardId" element={<BoardRouteWrapper />} />
            <Route path="/sign-in/*" element={<Navigate to="/" replace />} />
            <Route path="/sign-up/*" element={<Navigate to="/" replace />} />
            <Route path="/sso-callback" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ProtectedApp>
    </BrowserRouter>
  );
};
