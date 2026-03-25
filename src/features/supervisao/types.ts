export interface PostoTrabalho {
    id: string;
    empresa: 'FEMOG' | 'SEMOG';
    nome: string;
    status: 'ativo' | 'inativo';
    allocations_count?: number; // Optional count from join
    qtd_oficiais?: number;
    qtd_he?: number;
    created_at: string;
    updated_at: string;
}

export type PostoFormData = Omit<PostoTrabalho, 'id' | 'created_at' | 'updated_at' | 'allocations_count'>;

export interface AlocacaoFuncionario {
    id: string;
    posto_id: string;
    funcionario_id: string;
    escala: '12x36' | '5x2' | '6x1' | 'Outro';
    turno: 'Diurno' | 'Noturno';
    he: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields
    funcionario?: {
        nome: string;
        cargo?: {
            cargo: string;
        };
    };
}

export type AlocacaoFormData = Omit<AlocacaoFuncionario, 'id' | 'created_at' | 'updated_at' | 'funcionario'>;

export interface ServicoExtra {
    id: string;
    empresa: 'FEMOG' | 'SEMOG';
    posto_id: string;
    funcionario_id: string;
    cargo_id: string;
    turno: 'Diurno' | 'Noturno';
    entrada: string; // ISO string
    saida: string; // ISO string
    duracao: number;
    valor_hora: number;
    valor: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    posto?: { nome: string };
    funcionario?: { nome: string };
    cargo?: { cargo: string };
}

export type ServicoExtraFormData = Omit<ServicoExtra, 'id' | 'created_at' | 'updated_at' | 'duracao' | 'valor_hora' | 'valor' | 'posto' | 'funcionario' | 'cargo'>;

export type TipoApontamento = 'Abono' | 'Ausência' | 'Atestado' | 'Curso' | 'Penalidade' | 'Troca Presença' | 'Troca Ausência';

export interface Apontamento {
    id: string;
    empresa: 'FEMOG' | 'SEMOG';
    posto_id: string;
    funcionario_id: string;
    apontamento: TipoApontamento;
    data: string; // YYYY-MM-DD
    frequencia_pts: number;
    beneficios_pts: number;
    observacao?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    posto?: { nome: string };
    funcionario?: { nome: string };
}

export type ApontamentoFormData = Omit<Apontamento, 'id' | 'created_at' | 'updated_at' | 'frequencia_pts' | 'beneficios_pts' | 'posto' | 'funcionario'>;

export interface Escala {
    id: string;
    competencia: string; // YYYY-MM
    empresa: 'FEMOG' | 'SEMOG';
    posto_id: string;
    funcionario_id: string;
    escala: '12x36' | '5x2' | '6x1' | 'Outro';
    turno: 'Diurno' | 'Noturno';
    inicio_12x36?: 1 | 2; // For 12x36 par/impar
    tipo?: string; // Fixo, Cobre folga, Extra, etc
    dias: number[]; // e.g [1, 2, 5, 20] -> Dias numéricos do mês
    qnt_dias: number;
    created_at: string;
    updated_at: string;
    // Joined (Read-only frontend fields via Alocacoes / Funcionarios)
    funcionario?: {
        nome: string;
        cargo?: {
            cargo: string;
        }
    };
}

export type StatusTrocaPlantao = 'Pendente' | 'Em Análise' | 'Cancelado' | 'Autorizado' | 'Negado';

export interface TrocaPlantao {
    id: string;
    data_solicitacao: string;
    empresa: 'FEMOG' | 'SEMOG';
    funcionario_id: string;
    posto_id: string;
    data_original: string;
    data_reposicao: string;
    funcionario_troca_id: string;
    solicitante_id: string;
    de_acordo: boolean | null;
    status: StatusTrocaPlantao;
    data_analise?: string | null;
    responsavel_analise_id?: string | null;
    created_at: string;
    updated_at: string;
    // Joined Fields for Display
    funcionario?: { nome: string; cpf?: string };
    posto?: { nome: string };
    funcionario_troca?: { nome: string; cpf?: string };
    solicitante?: { nome: string };
    responsavel_analise?: { nome: string };
}

export type TrocaPlantaoFormData = Omit<TrocaPlantao, 'id' | 'data_solicitacao' | 'de_acordo' | 'status' | 'data_analise' | 'responsavel_analise_id' | 'created_at' | 'updated_at' | 'funcionario' | 'posto' | 'funcionario_troca' | 'solicitante' | 'responsavel_analise'>;

