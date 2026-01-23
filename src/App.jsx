
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './contexts/AuthProvider'
import PrivateRoute from './components/auth/PrivateRoute'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/index'
import Empresas from './pages/Configuracoes/Empresas'
import Contas from './pages/Configuracoes/Contas'
import CargosSalarios from './pages/DepartamentoPessoal/CargosSalarios'
import CartoesCredito from './pages/Configuracoes/CartoesCredito'
import Usuarios from './pages/Configuracoes/Usuarios'
import Contratos from './pages/Financeiro/Contratos'
import Faturamentos from './pages/Financeiro/Faturamentos'
import Recebimentos from './pages/Financeiro/Recebimentos'
import EquipamentosControlados from './pages/Estoque/EquipamentosControlados'
import ControleEstoque from './pages/Estoque/ControleEstoque'
import Funcionarios from './pages/DepartamentoPessoal/Funcionarios'
import GestaoPostos from './pages/Supervisao/GestaoPostos'
import ServicosExtras from './pages/Supervisao/ServicosExtras'
import Curriculos from './pages/Curriculos/Curriculos'
import Veiculos from './pages/Frota/Veiculos'

// Componente Genérico para Rotas em Desenvolvimento
const UnderConstruction = () => (
    <div className='p-8 text-slate-500 flex flex-col items-center justify-center h-full'>
        <h1 className='text-2xl font-bold mb-2'>Em Desenvolvimento</h1>
        <p>Módulo disponível em breve.</p>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Rota raiz redireciona para /app (o PrivateRoute vai mandar para login se precisar) */}
                        <Route path="/" element={<Navigate to="/app" replace />} />

                        {/* Rota de Login */}
                        <Route path="/login" element={<Login />} />

                        {/* Rotas Protegidas - prefixo /app */}
                        <Route path="/app" element={<PrivateRoute />}>
                            <Route element={<MainLayout />}>
                                <Route index element={<Dashboard />} />

                                {/* CURRÍCULOS */}
                                <Route path="curriculos" element={<Curriculos />} />

                                {/* ESTOQUE */}
                                <Route path="estoque/controle" element={<ControleEstoque />} />
                                <Route path="estoque/equipamentos" element={<EquipamentosControlados />} />

                                {/* DEPARTAMENTO PESSOAL */}
                                <Route path="dp/funcionarios" element={<Funcionarios />} />
                                <Route path="dp/cargos-salarios" element={<CargosSalarios />} />
                                <Route path="dp/folha" element={<UnderConstruction />} />

                                {/* SUPERVISÃO */}
                                <Route path="supervisao/gestao-postos" element={<GestaoPostos />} />
                                <Route path="supervisao/postos" element={<UnderConstruction />} />
                                <Route path="supervisao/escalas" element={<UnderConstruction />} />
                                <Route path="supervisao/servicos-extras" element={<ServicosExtras />} />

                                {/* FINANCEIRO */}
                                <Route path="financeiro/contratos" element={<Contratos />} />
                                <Route path="financeiro/faturamentos" element={<Faturamentos />} />
                                <Route path="financeiro/recebimentos" element={<Recebimentos />} />

                                {/* FROTA */}
                                <Route path="frota/veiculos" element={<Veiculos />} />

                                {/* CONFIGURAÇÕES */}
                                <Route path="config/usuarios" element={<Usuarios />} />
                                <Route path="config/empresas" element={<Empresas />} />
                                <Route path="config/contas" element={<Contas />} />
                                <Route path="config/cartoes" element={<CartoesCredito />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
    )
}

export default App
