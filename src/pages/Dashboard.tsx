import { type FC } from 'react';
import { useFuncionarios } from '../features/rh/hooks/useFuncionarios';
import { usePostos } from '../features/supervisao/hooks/usePostos';
import Calendar from '../components/Calendar';

const Dashboard: FC = () => {
    const { funcionarios, isLoading } = useFuncionarios();
    const { postos, isLoading: loadingPostos } = usePostos();

    // Calculate totals
    const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
    const postosAtivos = postos.filter(p => p.status === 'ativo').length;

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
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Postos Ativos</h3>
                    <p className="text-3xl font-bold text-gray-800">
                        {loadingPostos ? '...' : postosAtivos.toLocaleString()}
                    </p>
                    <span className="text-blue-500 text-sm font-medium flex items-center gap-1 mt-1">
                        Total das empresas
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

            <div className="mt-8">
                <Calendar />
            </div>
        </div>
    );
};

export default Dashboard;
