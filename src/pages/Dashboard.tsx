import { type FC } from 'react';
import { useFuncionarios } from '../features/rh/hooks/useFuncionarios';

const Dashboard: FC = () => {
    const { funcionarios, isLoading } = useFuncionarios();

    // Calculate total active employees
    const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;

    return (
        <div className="">

            <header className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-500">Bem-vindo ao SISMOG</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Funcionários Ativos</h3>
                    <p className="text-3xl font-bold text-gray-800">
                        {isLoading ? '...' : funcionariosAtivos.toLocaleString()}
                    </p>
                    <span className="text-emerald-500 text-sm font-medium flex items-center gap-1 mt-1">
                        Total das empresas
                    </span>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Relatórios Gerados</h3>
                    <p className="text-3xl font-bold text-gray-800">54</p>
                    <span className="text-blue-500 text-sm font-medium flex items-center gap-1 mt-1">
                        Atualizado hoje
                    </span>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Alertas Pendentes</h3>
                    <p className="text-3xl font-bold text-gray-800">3</p>
                    <span className="text-red-500 text-sm font-medium flex items-center gap-1 mt-1">
                        Ação necessária
                    </span>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Atividade Recente</h3>
                <div className="text-gray-500 text-sm py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Nenhuma atividade recente encontrada.
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
