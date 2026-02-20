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
