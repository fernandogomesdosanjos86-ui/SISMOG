import React, { useState, useMemo } from 'react';
import { Search, Calculator } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import { useModal } from '../../../context/ModalContext';
import { useBeneficios } from './hooks/useBeneficios';
import { gerarBeneficios } from './services/beneficiosService';
import BeneficiosKPIs from './components/BeneficiosKPIs';
import BeneficiosTable from './components/BeneficiosTable';
import GerarBeneficiosModal from './components/GerarBeneficiosModal';
import { useDebounce } from '../../../hooks/useDebounce';
import type { BeneficioCalculado } from './types';

const Beneficios: React.FC = () => {
    // Current date for default competence YYYY-MM
    const defaultCompetencia = new Date().toISOString().substring(0, 7);

    const [competenciaFilter, setCompetenciaFilter] = useState(defaultCompetencia);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [currentPage, setCurrentPage] = useState(1);

    const { openFormModal, openConfirmModal, closeModal, showFeedback } = useModal();
    const { beneficios, isLoading, refetch, deleteBeneficio } = useBeneficios(competenciaFilter, companyFilter);

    // Filtragem local textual (Posto, Funcionário, Cargo)
    const filteredDados = useMemo(() => {
        const sortByName = (arr: BeneficioCalculado[]) =>
            [...arr].sort((a, b) => (a.funcionarios?.nome || '').localeCompare(b.funcionarios?.nome || ''));

        if (!debouncedSearch) return sortByName(beneficios);

        const searchLower = debouncedSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W/g, "").toLowerCase();

        const filtrados = beneficios.filter(b => {
            const nome = (b.funcionarios?.nome || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W/g, "").toLowerCase();
            const cargo = (b.cargos_salarios?.cargo || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W/g, "").toLowerCase();
            const posto = (b.postos_trabalho?.nome || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W/g, "").toLowerCase();

            return nome.includes(searchLower) || cargo.includes(searchLower) || posto.includes(searchLower);
        });

        // Ordem alfabética por funcionário
        return sortByName(filtrados);
    }, [beneficios, debouncedSearch]);

    const handleCreate = () => {
        openFormModal(
            'Gerar Novos Benefícios',
            <GerarBeneficiosModal
                onClose={() => closeModal()} // correctly passing closeModal
                onGenerate={async (comp, emp) => {
                    const numGerados = await gerarBeneficios({ competencia: comp, empresa: emp });
                    showFeedback('success', `${numGerados} registros calculados e inseridos com sucesso.`);

                    // Se estivermos na mesma competência atual do filtro, atualizamos a tela
                    if (comp === competenciaFilter) {
                        refetch();
                    }
                }}
            />
        );
    };

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Cálculo',
            'Deseja realmente excluir este cálculo? Você poderá usar o botão Gerar Benefícios novamente para recalcular este funcionário se necessário.',
            async () => {
                try {
                    await deleteBeneficio(id);
                    showFeedback('success', 'Registro excluído. Você pode gerá-lo novamente.');
                } catch {
                    showFeedback('error', 'Falha ao excluir o registro.');
                }
            }
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Benefícios"
                subtitle="Calcule e acompanhe o pagamento de benefícios segundo apontamentos."
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-gray-700 font-medium"
                            value={competenciaFilter}
                            onChange={(e) => {
                                setCompetenciaFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <PrimaryButton onClick={handleCreate} className="w-full justify-center">
                            <Calculator size={20} className="mr-2" />
                            Gerar Benefícios
                        </PrimaryButton>
                    </div>
                }
            />

            <BeneficiosKPIs data={filteredDados} />

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, cargo ou posto..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Company Tabs */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {(['TODOS', 'FEMOG', 'SEMOG'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setCompanyFilter(tab);
                            setCurrentPage(1);
                        }}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${companyFilter === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'TODOS' ? 'Todas' : tab}
                    </button>
                ))}
            </div>

            <BeneficiosTable
                data={filteredDados}
                isLoading={isLoading}
                onDelete={handleDelete}
                page={currentPage}
                itemsPerPage={50}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default Beneficios;
