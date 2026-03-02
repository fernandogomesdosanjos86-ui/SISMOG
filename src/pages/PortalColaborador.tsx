import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, ClipboardCheck, ArrowRightLeft, Fuel, CalendarSync, ActivitySquare } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import ChecklistForm from '../features/frota/components/ChecklistForm';
import MovimentacaoForm from '../features/frota/components/MovimentacaoForm';
import UserSettingsForm from '../components/UserSettingsForm';

const PortalColaborador: React.FC = () => {
    const { user, signOut } = useAuth();
    const { openFormModal, closeModal } = useModal();

    // Safely extract name (as done in Sidebar)
    const displayName = user?.user_metadata?.nome || 'Colaborador';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0];
    const secondName = nameParts.length > 1 ? nameParts[1] : '';

    const handleLogout = async () => {
        await signOut();
    };

    const handleOpenProfile = () => {
        openFormModal('Configurações de Usuário', <UserSettingsForm />);
    };

    const handleOpenChecklist = () => {
        openFormModal('Novo Checklist Diário', <ChecklistForm onSuccess={closeModal} />);
    };

    const handleOpenMovimentacao = () => {
        openFormModal('Nova Movimentação', <MovimentacaoForm onSuccess={closeModal} />);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            {/* Topbar Azure Style */}
            <header className="bg-blue-900 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="SISMOG Logo" className="h-8 w-8 object-contain bg-white/10 rounded-md p-1" />
                    <span className="font-bold text-lg tracking-wide hidden sm:inline-block">SISMOG</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleOpenProfile} className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none" title="Configurações">
                        <Settings size={20} />
                    </button>
                    <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-red-100 rounded-full transition-colors focus:outline-none" title="Sair do Sistema">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6">

                {/* Greeting Section */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Bem-vindo(a),</p>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                            {firstName} {secondName}
                        </h1>
                    </div>
                </section>

                {/* Section: Controle de Frota */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider px-1">Controle de Frota</h2>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={handleOpenChecklist}
                            className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 p-4 rounded-xl flex items-center justify-between transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <ClipboardCheck size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-900 transition-colors">Checklist Diário</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Veículos e Equipamentos</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleOpenMovimentacao}
                            className="bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 p-4 rounded-xl flex items-center justify-between transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-100 text-orange-600 p-3 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <ArrowRightLeft size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-800 group-hover:text-orange-900 transition-colors">Movimentações</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Registrar Saída e Retorno</p>
                                </div>
                            </div>
                        </button>

                        <button
                            disabled
                            className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between opacity-60 cursor-not-allowed"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-200 text-gray-500 p-3 rounded-xl">
                                    <Fuel size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-700">Abastecimentos</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Em breve</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Section: Troca de Plantão */}
                <section className="space-y-3 pt-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Troca de Plantão</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            disabled
                            className="bg-white/50 border border-gray-200 p-4 rounded-xl flex flex-col items-center justify-center gap-2 opacity-60 cursor-not-allowed min-h-[110px]"
                        >
                            <CalendarSync size={24} className="text-gray-400" />
                            <h3 className="font-semibold text-gray-600 text-sm">Solicitar Troca</h3>
                        </button>

                        <button
                            disabled
                            className="bg-white/50 border border-gray-200 p-4 rounded-xl flex flex-col items-center justify-center gap-2 opacity-60 cursor-not-allowed min-h-[110px]"
                        >
                            <ActivitySquare size={24} className="text-gray-400" />
                            <h3 className="font-semibold text-gray-600 text-sm">Acompanhar</h3>
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default PortalColaborador;
