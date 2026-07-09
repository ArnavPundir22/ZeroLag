import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedApp } from '../features/auth/components/ProtectedApp';
import { AppLayout } from '../layouts/AppLayout';
import { Dashboard } from '../features/dashboard/components/Dashboard';
import { BoardRouteWrapper } from '../features/boards/routes/BoardView';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ProtectedApp>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/b/:boardId" element={<BoardRouteWrapper />} />
          </Route>
        </Routes>
      </ProtectedApp>
    </BrowserRouter>
  );
};
