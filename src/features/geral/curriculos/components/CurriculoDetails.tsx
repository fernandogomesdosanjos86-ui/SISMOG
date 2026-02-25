import { Info, Download, FileText } from 'lucide-react';
import CompanyBadge from '../../../../components/CompanyBadge';
import type { Curriculo } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CurriculoDetailsProps {
    curriculo: Curriculo;
}

const statusColors: Record<Curriculo['status'], string> = {
    Pendente: 'bg-yellow-100 text-yellow-800',
    Aprovado: 'bg-green-100 text-green-800',
    Reprovado: 'bg-red-100 text-red-800',
    Contratado: 'bg-blue-100 text-blue-800',
};

const CurriculoDetails = ({ curriculo }: CurriculoDetailsProps) => (
    <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{curriculo.nome}</h3>
                <p className="text-sm text-gray-500 mt-1">{curriculo.cargo}</p>
            </div>
            <CompanyBadge company={curriculo.empresa} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Info size={16} className="mr-2" /> Status
                </div>
                <div className="mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[curriculo.status]}`}>
                        {curriculo.status}
                    </span>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Info size={16} className="mr-2" /> Indicação
                </div>
                <div className="text-gray-900 font-medium text-sm">
                    {curriculo.indicacao || 'Nenhûma / Direta'}
                </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-start gap-2 sm:col-span-2">
                <div className="flex items-center text-blue-700 text-sm font-medium mb-1 w-full justify-between">
                    <div className="flex items-center">
                        <FileText size={16} className="mr-2" /> Currículo (Arquivo)
                    </div>
                </div>
                <div className="w-full mt-2">
                    {curriculo.arquivo_url ? (
                        <a
                            href={curriculo.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            <Download size={16} className="mr-2" />
                            Baixar Anexo
                        </a>
                    ) : (
                        <span className="text-gray-500 text-sm italic">Nenhum arquivo anexado</span>
                    )}
                </div>
            </div>

            {curriculo.observacoes && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 sm:col-span-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Info size={16} className="mr-2" /> Observações
                    </div>
                    <div className="text-gray-900 text-sm whitespace-pre-wrap">
                        {curriculo.observacoes}
                    </div>
                </div>
            )}
        </div>
        <div className="text-xs text-gray-400 pt-4 text-center">
            Adicionado em {format(new Date(curriculo.data), "dd/MM/yyyy", { locale: ptBR })}
            <br />
            Registro criado em {format(new Date(curriculo.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </div>
    </div>
);

export default CurriculoDetails;
