export interface Curriculo {
    id: string;
    data: string;
    nome: string;
    cargo: string;
    indicacao: string | null;
    observacoes: string | null;
    arquivo_url: string | null;
    status: 'Pendente' | 'Aprovado' | 'Reprovado' | 'Contratado';
    empresa: 'FEMOG' | 'SEMOG';
    created_at: string;
}

export interface CurriculoFormData {
    data: string;
    nome: string;
    cargo: string;
    indicacao: string;
    observacoes: string;
    status: 'Pendente' | 'Aprovado' | 'Reprovado' | 'Contratado';
    empresa: 'FEMOG' | 'SEMOG';
    arquivo: File | null;
}

export interface CurriculosFilters {
    searchTerm?: string;
    statusFilter?: string;
    companyFilter?: string;
    page: number;
    pageSize: number;
}
