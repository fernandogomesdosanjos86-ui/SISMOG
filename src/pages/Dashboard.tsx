import { type FC } from 'react';


const Dashboard: FC = () => {
    return (
        <div className="p-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                    <p className="text-gray-500">Bem-vindo ao SISMOG</p>
                </div>
                <button className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm">
                    Nova Ação
                </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Total Usuários</h3>
                    <p className="text-3xl font-bold text-gray-800">1,234</p>
                    <span className="text-emerald-500 text-sm font-medium flex items-center gap-1 mt-1">
                        +12% este mês
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
