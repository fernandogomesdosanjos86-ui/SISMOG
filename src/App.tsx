import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import NotFound from './pages/NotFound';
import { APP_ROUTES } from './config/routes';

// Lazy Imports
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const UserList = lazy(() => import('./features/users/components/UserList'));
const Contratos = lazy(() => import('./features/financeiro/Contratos'));
const Faturamentos = lazy(() => import('./features/financeiro/Faturamentos'));
const Recebimentos = lazy(() => import('./features/financeiro/Recebimentos'));
const EquipamentosControlados = lazy(() => import('./features/estoque/EquipamentosControlados'));


function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path={APP_ROUTES.LOGIN} element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path={APP_ROUTES.HOME} element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path={APP_ROUTES.USERS} element={<UserList />} />

            {/* Financeiro */}
            <Route path={APP_ROUTES.FINANCEIRO.CONTRATOS} element={<Contratos />} />
            <Route path={APP_ROUTES.FINANCEIRO.FATURAMENTOS} element={<Faturamentos />} />
            <Route path={APP_ROUTES.FINANCEIRO.RECEBIMENTOS} element={<Recebimentos />} />

            {/* Estoque */}
            <Route path={APP_ROUTES.ESTOQUE.EQUIPAMENTOS} element={<EquipamentosControlados />} />
          </Route>

        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
