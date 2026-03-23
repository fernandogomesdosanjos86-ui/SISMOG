import React from 'react';
import type { Contrato } from '../types';
import { Info, Calendar, DollarSign, CalendarDays, FileText } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';
import ResponsiveTable from '../../../components/ResponsiveTable';
import PrimaryButton from '../../../components/PrimaryButton';
import { useContratoDocumentos } from '../hooks/useContratoDocumentos';
import { useModal } from '../../../context/ModalContext';
import DocumentoForm from './DocumentoForm';
import { Download, Trash2, FileUp } from 'lucide-react';

interface ContratoDetailsProps {
    contrato: Contrato;
}

const ContratoDetails: React.FC<ContratoDetailsProps> = ({ contrato }) => {
    const { documentos, isLoading, refetch, delete: deleteDoc } = useContratoDocumentos(contrato.id);
    const { openFormModal, openConfirmModal, showFeedback } = useModal();

    const handleUpload = () => {
        openFormModal('Anexar Documento', <DocumentoForm contratoId={contrato.id} onSuccess={refetch} />);
    };

    const handleDelete = (id: string, url: string) => {
        openConfirmModal('Excluir Documento', 'Tem certeza que deseja apagar este arquivo?', async () => {
            try {
                await deleteDoc({ id, arquivoUrl: url });
                showFeedback('success', 'Documento excluído!');
            } catch {
                showFeedback('error', 'Erro ao excluir documento.');
            }
        });
    };

    const columns = [
        { key: 'data', header: 'Data', render: (i: any) => new Date(i.created_at).toLocaleDateString('pt-BR') },
        { key: 'descricao', header: 'Descrição', render: (i: any) => <span className="font-medium text-gray-900">{i.descricao}</span> },
        {
            key: 'acoes', header: 'Ações', render: (i: any) => (
                <div className="flex gap-3 justify-end">
                    <a href={i.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded-lg">
                        <Download size={18} />
                    </a>
                    <button onClick={() => handleDelete(i.id, i.arquivo_url)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
    <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{contrato.contratante}</h3>
                <p className="text-sm text-gray-500 mt-1">{contrato.nome_posto}</p>
            </div>
            <CompanyBadge company={contrato.empresa} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Info size={16} className="mr-2" /> Status
                </div>
                <div className="mt-1"><StatusBadge active={contrato.status === 'ativo'} /></div>
            </div>
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-2">
                <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                    <DollarSign size={16} className="mr-2" /> Valor Mensal
                </div>
                <div className="text-green-900 font-semibold text-lg">{formatCurrency(contrato.valor_mensal)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Calendar size={16} className="mr-2" /> Início
                </div>
                <div className="text-gray-900 font-semibold text-lg">{new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <CalendarDays size={16} className="mr-2" /> Duração
                </div>
                <div className="text-gray-900 font-semibold text-lg">{contrato.duracao_meses} meses</div>
            </div>
        </div>

        <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm pb-1 border-b">
                <FileText size={16} className="text-blue-500" />
                Detalhes Financeiros
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-gray-500 font-medium tracking-wide text-xs">Faturamento (Dia)</span>
                    <span className="font-bold text-gray-900 text-base">{contrato.dia_faturamento}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-gray-500 font-medium tracking-wide text-xs">Vencimento (Dia)</span>
                    <span className="font-bold text-gray-900 text-base">{contrato.dia_vencimento}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-gray-500 font-medium tracking-wide text-xs">Vence Mês Corrente?</span>
                    <span className="font-bold text-gray-900 text-base">{contrato.vencimento_mes_corrente ? 'Sim' : 'Não'}</span>
                </div>
            </div>
        </div>

        {/* Retentions View */}
        {(contrato.retencao_iss || contrato.retencao_pis || contrato.retencao_cofins || contrato.retencao_csll || contrato.retencao_irpj || contrato.retencao_inss) && (
            <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Retenções</h4>
                <div className="flex flex-wrap gap-2">
                    {contrato.retencao_iss && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">ISS ({contrato.perc_iss}%)</span>}
                    {contrato.retencao_pis && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">PIS</span>}
                    {contrato.retencao_cofins && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">COFINS</span>}
                    {contrato.retencao_csll && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">CSLL</span>}
                    {contrato.retencao_irpj && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">IRPJ</span>}
                    {contrato.retencao_inss && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">INSS</span>}
                </div>
            </div>
        )}

        {/* Documentos View */}
        <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                    <FileText size={16} className="text-blue-500" />
                    Documentos e Anexos
                </h4>
                <PrimaryButton onClick={handleUpload}>
                    <FileUp size={16} className="mr-2" /> Anexar
                </PrimaryButton>
            </div>
            
            <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                <ResponsiveTable
                    data={documentos}
                    columns={columns}
                    emptyMessage="Nenhum documento anexado a este contrato."
                    keyExtractor={(i) => i.id}
                    loading={isLoading}
                    getRowBorderColor={() => 'border-gray-200'}
                    renderCard={(i: any) => (
                        <div className="border-l-4 border-l-blue-500 pl-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-1">{i.descricao}</h4>
                                    <span className="text-xs text-gray-500">{new Date(i.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex gap-2">
                                    <a href={i.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 bg-blue-50 p-2 rounded-lg">
                                        <Download size={16} />
                                    </a>
                                    <button onClick={() => handleDelete(i.id, i.arquivo_url)} className="text-red-600 bg-red-50 p-2 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>

    </div>
    );
};

export default ContratoDetails;
