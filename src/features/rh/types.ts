export interface CargoSalario {
    id: string;
    empresa: 'FEMOG' | 'SEMOG';
    cargo: string;
    uf: string;
    salario_base: number;
    perc_periculosidade: number;
    perc_insalubridade: number;
    perc_adc_noturno: number;
    perc_intrajornada: number;
    valor_aux_alim: number;
    perc_desc_alim: number;
    valor_he_diurno: number;
    valor_he_noturno: number;
    created_at?: string;
    updated_at?: string;
}

export interface Funcionario {
    id: string;
    empresa: 'FEMOG' | 'SEMOG';
    nome: string;
    cpf: string;
    cargo_id: string;
    tipo_contrato: string;
    banco: string;
    agencia: string;
    conta: string;
    pix: string;
    uniforme?: string;
    valor_transporte_dia?: number;
    valor_combustivel_dia?: number;
    status: 'ativo' | 'inativo' | 'ferias' | 'afastado';
    data_admissao?: string | null;
    data_desligamento?: string | null;
    // Joined fields
    cargo?: {
        cargo: string;
    };
    created_at?: string;
    updated_at?: string;
    cargos_salarios?: CargoSalario; // Joined relation
}

export type FuncionarioFormData = Omit<Funcionario, 'id' | 'created_at' | 'updated_at' | 'cargos_salarios'>;

export type NivelPenalidade = 'Advertência Verbal' | 'Advertência Escrita' | 'Suspensão';

export interface Penalidade {
    id: string;
    data: string; // YYYY-MM-DD
    empresa: 'FEMOG' | 'SEMOG';
    funcionario_id: string;
    penalidade: NivelPenalidade;
    descricao?: string;
    arquivo_url?: string;
    created_at?: string;
    // Joined
    funcionario?: {
        nome: string;
    };
}

export type PenalidadeFormData = Omit<Penalidade, 'id' | 'created_at' | 'funcionario'>;

export type TipoGratificacao = 'Folha de Pagamento' | 'Incentivo';

export interface Gratificacao {
    id: string;
    data: string; // YYYY-MM-DD
    empresa: 'FEMOG' | 'SEMOG';
    funcionario_id: string;
    tipo: TipoGratificacao;
    gratificacao_percentual?: number;
    incentivo_valor?: number;
    observacao?: string;
    status: boolean;
    created_at?: string;
    // Joined
    funcionario?: {
        nome: string;
    };
}

export type GratificacaoFormData = Omit<Gratificacao, 'id' | 'created_at' | 'funcionario'>;

export interface ParametrosFolha {
    id: string;
    ano: number;
    valor_salario_minimo: number;
    teto_salario_familia: number;
    valor_salario_familia: number;
    
    teto_inss_1: number;
    aliquota_inss_1: number;
    desconto_inss_1: number;
    
    teto_inss_2: number;
    aliquota_inss_2: number;
    desconto_inss_2: number;
    
    teto_inss_3: number;
    aliquota_inss_3: number;
    desconto_inss_3: number;
    
    teto_inss_4: number;
    aliquota_inss_4: number;
    desconto_inss_4: number;
    
    created_at?: string;
    updated_at?: string;
}

export type ParametrosFolhaFormData = Omit<ParametrosFolha, 'id' | 'created_at' | 'updated_at'>;

