import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Empresas from './pages/Empresas';
import Home from './pages/Home';
import CargosSalarios from './pages/CargosSalarios';
import PostosTrabalho from './pages/PostosTrabalho';
import Contratos from './pages/Contratos';
import Faturamentos from './pages/Faturamentos';
import Recebimentos from './pages/Recebimentos';
import GestaoArmamento from './pages/GestaoArmamento';
import ContasCorrente from './pages/Financeiro/ContasCorrente';
import CartoesCredito from './pages/Financeiro/CartoesCredito';
import Curriculos from './pages/Curriculos';
import Funcionarios from './pages/Funcionarios';
import Penalidades from './pages/Penalidades';
import Supervisao from './pages/Supervisao';
import Frota from './pages/Frota';
import Formularios from './pages/Formularios';
import ControleEstoque from './pages/ControleEstoque';
import Configuracoes from './pages/Configuracoes';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
      <Route path="/empresas" element={<ProtectedRoute><Empresas /></ProtectedRoute>} />
      <Route path="/cargos-salarios" element={<ProtectedRoute><CargosSalarios /></ProtectedRoute>} />
      <Route path="/postos-trabalho" element={<ProtectedRoute><PostosTrabalho /></ProtectedRoute>} />
      <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
      <Route path="/faturamentos" element={<ProtectedRoute><Faturamentos /></ProtectedRoute>} />
      <Route path="/recebimentos" element={<ProtectedRoute><Recebimentos /></ProtectedRoute>} />
      <Route path="/financeiro/contas" element={<ProtectedRoute><ContasCorrente /></ProtectedRoute>} />
      <Route path="/financeiro/cartoes" element={<ProtectedRoute><CartoesCredito /></ProtectedRoute>} />
      <Route path="/curriculos" element={<ProtectedRoute><Curriculos /></ProtectedRoute>} />
      <Route path="/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
      <Route path="/penalidades" element={<ProtectedRoute><Penalidades /></ProtectedRoute>} />
      <Route path="/supervisao" element={<ProtectedRoute><Supervisao /></ProtectedRoute>} />
      <Route path="/frota" element={<ProtectedRoute><Frota /></ProtectedRoute>} />
      <Route path="/formularios" element={<ProtectedRoute><Formularios /></ProtectedRoute>} />
      <Route path="/equipamentos-controlados" element={<ProtectedRoute><GestaoArmamento /></ProtectedRoute>} />
      <Route path="/estoque" element={<ProtectedRoute><ControleEstoque /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
