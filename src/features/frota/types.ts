export interface Veiculo {
    id: string;
    marca_modelo: string;
    placa: string;
    tipo: 'Combustão' | 'Elétrico';
    abastecimento: boolean;
    capacidade_bateria?: number;
    status: 'Ativo' | 'Em Manutenção' | 'Inativo';
    created_at: string;
}

export interface VeiculoFormData {
    marca_modelo: string;
    placa: string;
    tipo: 'Combustão' | 'Elétrico';
    abastecimento: boolean;
    capacidade_bateria?: number;
    status: 'Ativo' | 'Em Manutenção' | 'Inativo';
}

export interface Abastecimento {
    id: string;
    data: string;
    veiculo_id: string;
    km_atual: number;
    litros: number;
    valor: number;
    responsavel: string;
    created_at: string;

    // Joined vehicle data
    frota_veiculos?: {
        marca_modelo: string;
        placa: string;
        tipo?: 'Combustão' | 'Elétrico';
        abastecimento?: boolean;
    };
}

export interface AbastecimentoFormData {
    data: string;
    veiculo_id: string;
    km_atual: number | '';
    litros: number | '';
    valor: number | '';
}

export type ChecklistItem =
    | 'Capa de Chuva'
    | 'Chave de Roda'
    | 'Colete Refletivo'
    | 'Compressor 12v'
    | 'Estepe 01'
    | 'Estepe 02'
    | 'Kit de Reparo'
    | 'Kit Primeiros Socorros'
    | 'Lanterna'
    | 'Macaco'
    | 'Triângulo';

export const CHECKLIST_ITEMS: ChecklistItem[] = [
    'Capa de Chuva',
    'Chave de Roda',
    'Colete Refletivo',
    'Compressor 12v',
    'Estepe 01',
    'Estepe 02',
    'Kit de Reparo',
    'Kit Primeiros Socorros',
    'Lanterna',
    'Macaco',
    'Triângulo'
];

export interface Checklist {
    id: string;
    data: string;
    veiculo_id: string;
    km_atual: number;
    checkitens: ChecklistItem[];
    outros_itens: string | null;
    avaria_manutencao: boolean;
    descricao_avaria: string | null;
    responsavel: string;
    created_at: string;

    // Joined vehicle data
    frota_veiculos?: {
        marca_modelo: string;
        placa: string;
    };
}

export interface ChecklistFormData {
    data: string;
    veiculo_id: string;
    km_atual: number | '';
    checkitens: ChecklistItem[];
    outros_itens: string;
    avaria_manutencao: boolean;
    descricao_avaria: string;
}

export interface Movimentacao {
    id: string;
    data_hora_inicial: string;
    data_hora_final: string;
    veiculo_id: string;
    trajeto: string;
    km_inicial: number;
    km_final: number;
    km_rodados: number;
    bateria_inicial?: number;
    bateria_final?: number;
    consumo_bateria?: number;
    consumo_kw?: number;
    responsavel: string;
    created_at: string;
    veiculo?: {
        marca_modelo: string;
        placa: string;
        tipo: 'Combustão' | 'Elétrico';
        abastecimento: boolean;
        status: 'Ativo' | 'Em Manutenção' | 'Inativo';
    };
    frota_veiculos?: {
        marca_modelo: string;
        placa: string;
        tipo: 'Combustão' | 'Elétrico';
        abastecimento: boolean;
        status: 'Ativo' | 'Em Manutenção' | 'Inativo';
    };
}

export interface MovimentacaoFormData {
    data_hora_inicial: string;
    data_hora_final: string;
    veiculo_id: string;
    trajeto: string;
    km_inicial: number | '';
    km_final: number | '';
    bateria_inicial?: number | '';
    bateria_final?: number | '';
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    totalPages: number;
}

export interface MovimentacoesFilters {
    searchTerm?: string;
    month?: string;
    year?: string;
    page: number;
    pageSize: number;
}

export interface AbastecimentosFilters {
    searchTerm?: string;
    monthFilter?: string; // "YYYY-MM"
    page: number;
    pageSize: number;
}

export interface ChecklistsFilters {
    searchTerm?: string;
    monthFilter?: string; // "YYYY-MM"
    avariasOnly?: boolean;
    page: number;
    pageSize: number;
}
