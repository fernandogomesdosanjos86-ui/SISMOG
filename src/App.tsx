import { Suspense, lazy } from 'react';

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
const RelatorioFinanceiro = lazy(() => import('./features/financeiro/RelatorioFinanceiro'));
const EquipamentosControlados = lazy(() => import('./features/estoque/EquipamentosControlados'));
const GestaoEstoque = lazy(() => import('./features/estoque/gestao/GestaoEstoque'));
const CargosSalarios = lazy(() => import('./features/rh/CargosSalarios'));
const Funcionarios = lazy(() => import('./features/rh/Funcionarios'));
const Beneficios = lazy(() => import('./features/rh/beneficios/Beneficios'));
const GestaoPostos = lazy(() => import('./features/supervisao/GestaoPostos'));
const ServicosExtras = lazy(() => import('./features/supervisao/ServicosExtras'));
const Apontamentos = lazy(() => import('./features/supervisao/Apontamentos'));
const Escalas = lazy(() => import('./features/supervisao/Escalas'));
const Penalidades = lazy(() => import('./features/rh/Penalidades'));
const Gratificacoes = lazy(() => import('./features/rh/Gratificacoes'));
const Veiculos = lazy(() => import('./features/frota/Veiculos'));
const Abastecimentos = lazy(() => import('./features/frota/Abastecimentos'));
const Checklists = lazy(() => import('./features/frota/Checklists'));
const Movimentacoes = lazy(() => import('./features/frota/Movimentacoes'));
const RelatorioFrota = lazy(() => import('./features/frota/RelatorioFrota'));
const Curriculos = lazy(() => import('./features/geral/curriculos/Curriculos'));
const Tarefas = lazy(() => import('./features/geral/tarefas/Tarefas'));

const PortalColaborador = lazy(() => import('./pages/PortalColaborador'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path={APP_ROUTES.LOGIN} element={<Login />} />

        <Route element={<ProtectedRoute />}>
          {/* Rota exclusiva do portal (sem sidebar/MainLayout) */}
          <Route path={APP_ROUTES.PORTAL_COLABORADOR} element={<PortalColaborador />} />

          {/* Rotas Administrativas com Sidebar */}
          <Route path={APP_ROUTES.HOME} element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path={APP_ROUTES.USERS} element={<UserList />} />

            {/* Financeiro */}
            <Route path={APP_ROUTES.FINANCEIRO.CONTRATOS} element={<Contratos />} />
            <Route path={APP_ROUTES.FINANCEIRO.FATURAMENTOS} element={<Faturamentos />} />
            <Route path={APP_ROUTES.FINANCEIRO.RECEBIMENTOS} element={<Recebimentos />} />
            <Route path={APP_ROUTES.FINANCEIRO.RELATORIOS} element={<RelatorioFinanceiro />} />

            {/* Estoque */}
            <Route path={APP_ROUTES.ESTOQUE.EQUIPAMENTOS} element={<EquipamentosControlados />} />
            <Route path={APP_ROUTES.ESTOQUE.GESTAO_ESTOQUE} element={<GestaoEstoque />} />

            {/* RH */}
            <Route path={APP_ROUTES.RH.CARGOS_SALARIOS} element={<CargosSalarios />} />
            <Route path={APP_ROUTES.RH.FUNCIONARIOS} element={<Funcionarios />} />
            <Route path={APP_ROUTES.RH.BENEFICIOS} element={<Beneficios />} />
            <Route path={APP_ROUTES.RH.PENALIDADES} element={<Penalidades />} />
            <Route path={APP_ROUTES.RH.GRATIFICACOES} element={<Gratificacoes />} />

            {/* Supervisão */}
            <Route path={APP_ROUTES.SUPERVISAO.POSTOS} element={<GestaoPostos />} />
            <Route path={APP_ROUTES.SUPERVISAO.SERVICOS_EXTRAS} element={<ServicosExtras />} />
            <Route path={APP_ROUTES.SUPERVISAO.APONTAMENTOS} element={<Apontamentos />} />
            <Route path={APP_ROUTES.SUPERVISAO.ESCALAS} element={<Escalas />} />

            {/* Gestão de Frota */}
            <Route path={APP_ROUTES.FROTA.VEICULOS} element={<Veiculos />} />
            <Route path={APP_ROUTES.FROTA.ABASTECIMENTOS} element={<Abastecimentos />} />
            <Route path={APP_ROUTES.FROTA.CHECKLISTS} element={<Checklists />} />
            <Route path={APP_ROUTES.FROTA.MOVIMENTACOES} element={<Movimentacoes />} />
            <Route path={APP_ROUTES.FROTA.RELATORIOS} element={<RelatorioFrota />} />

            {/* Geral */}
            <Route path={APP_ROUTES.GERAL.CURRICULOS} element={<Curriculos />} />
            <Route path={APP_ROUTES.GERAL.TAREFAS} element={<Tarefas />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
