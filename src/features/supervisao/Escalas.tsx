import React, { useState } from 'react';
import { ChevronRight, Building2, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { usePostos } from './hooks/usePostos';
import { usePostosComEscala } from './hooks/usePostosComEscala';
import EscalasGrid from './components/EscalasGrid';
import { useModal } from '../../context/ModalContext';
import EscalaForm from './components/EscalaForm';
import { escalasService } from '../../services/escalasService';

type EmpresaFilter = 'FEMOG' | 'SEMOG' | 'Todas';

const Escalas: React.FC = () => {
    // Top-Level State
    const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7));
    const [empresa, setEmpresa] = useState<EmpresaFilter>('Todas');
    const [searchTerm, setSearchTerm] = useState('');

    // Accordion State
    const [expandedPostoId, setExpandedPostoId] = useState<string | null>(null);

    const { openFormModal, closeModal, showFeedback } = useModal();
    const { postos, isLoading: isLoadingPostos } = usePostos();
    const { data: postosComEscalaIds = [], isLoading: isLoadingEscalasIds, refetch: refetchEscalasIds } = usePostosComEscala(competencia);

    const isLoading = isLoadingPostos || isLoadingEscalasIds;

    // Data Filtering
    const filteredPostos = postos
        .filter(p => postosComEscalaIds.includes(p.id)) // Only show Postos that HAVE scales for this month
        .filter(p => (empresa === 'Todas' ? true : p.empresa === empresa))
        .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    // Handlers
    const toggleAccordion = (id: string) => {
        setExpandedPostoId(prev => prev === id ? null : id);
    };

    const handleGenerateEscala = async (comp: string, emp: 'FEMOG' | 'SEMOG', postoIdStr: string) => {
        try {
            closeModal();
            await escalasService.gerarEscalaParaPosto(postoIdStr, comp, emp);
            await refetchEscalasIds();
            showFeedback('success', 'Escala gerada com sucesso! Você já pode visualizá-la no posto selecionado.');

            // Expand newly generated posto
            setCompetencia(comp);
            setEmpresa(emp);
            setExpandedPostoId(postoIdStr);
        } catch (error: any) {
            console.error('Failed to generate escala', error);
            showFeedback('error', error?.message || 'Erro ao gerar escala.');
        }
    };

    const handleOpenForm = () => {
        openFormModal('Gerar Nova Escala', <EscalaForm
            onSubmit={handleGenerateEscala}
            onCancel={closeModal}
        />);
    };

    const getThemeColor = (emp: string) => emp === 'FEMOG' ? 'text-blue-600' : emp === 'SEMOG' ? 'text-orange-600' : 'text-gray-600';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Escalas"
                subtitle="Planejamento mensal de turnos por Posto de Trabalho"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-gray-700 font-medium"
                            value={competencia}
                            onChange={(e) => {
                                setCompetencia(e.target.value);
                                setExpandedPostoId(null);
                            }}
                        />
                        <button
                            onClick={handleOpenForm}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto font-medium"
                        >
                            Gerar Escala
                        </button>
                    </div>
                }
            />

            {/* Search Filter Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 p-4 lg:p-6 bg-gray-50 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar posto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Company Tabs */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm border border-gray-100">
                {(['Todas', 'FEMOG', 'SEMOG'] as EmpresaFilter[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setEmpresa(tab);
                            setExpandedPostoId(null);
                        }}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${empresa === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Accordion List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                        <p className="text-gray-500 font-medium">Carregando postos de trabalho...</p>
                    </div>
                ) : filteredPostos.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                        <Building2 className="text-gray-300 mb-4" size={56} strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-gray-700 mb-1">
                            {searchTerm ? 'Nenhum posto encontrado na busca' : 'Nenhuma escala gerada'}
                        </h3>
                        <p className="text-gray-500 font-medium max-w-sm">
                            {searchTerm
                                ? 'Tente ajustar os filtros ou a busca para encontrar postos de trabalho.'
                                : 'Clique em "Gerar Escala" no topo da página para iniciar a nova escala de um posto.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredPostos.map((posto) => {
                            const isExpanded = expandedPostoId === posto.id;
                            return (
                                <div key={posto.id} className="flex flex-col transition-colors border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <EscalasGrid
                                        posto={posto}
                                        competencia={competencia}
                                        empresa={posto.empresa as 'FEMOG' | 'SEMOG'}
                                        isExpanded={isExpanded}
                                        onToggle={() => toggleAccordion(posto.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Escalas;
