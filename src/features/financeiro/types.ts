export type Empresa = 'SEMOG' | 'FEMOG';

export interface Contrato {
    id: string;
    empresa: Empresa;
    contratante: string;
    nome_posto: string;
    data_inicio: string;
    duracao_meses: number;
    valor_mensal: number;
    dia_faturamento: number;
    dia_vencimento: number;
    vencimento_mes_corrente: boolean;
    perc_iss: number;
    retencao_iss: boolean;
    retencao_pis: boolean;
    retencao_cofins: boolean;
    retencao_irpj: boolean;
    retencao_csll: boolean;
    retencao_inss: boolean;
    tem_retencao_caucao: boolean;
    perc_retencao_caucao: number;
    status: 'ativo' | 'inativo';
    created_at?: string;
    updated_at?: string;
}

export interface Faturamento {
    id: string;
    contrato_id: string;
    competencia: string;
    valor_base_contrato: number;
    acrescimo: number;
    desconto: number;
    valor_bruto: number;
    retencao_pis: boolean;
    valor_retencao_pis: number;
    retencao_cofins: boolean;
    valor_retencao_cofins: number;
    retencao_irpj: boolean;
    valor_retencao_irpj: number;
    retencao_csll: boolean;
    valor_retencao_csll: number;
    retencao_inss: boolean;
    valor_retencao_inss: number;
    retencao_iss: boolean;
    perc_iss: number;
    valor_retencao_iss: number;
    retencao_caucao?: boolean;
    perc_retencao_caucao?: number;
    valor_retencao_caucao?: number;
    valor_liquido: number;
    data_emissao?: string;
    data_vencimento?: string;
    numero_nf?: string;
    status: 'pendente' | 'emitido';
    observacoes?: string;
    created_at?: string;
    updated_at?: string;
    contratos?: Contrato; // For join
}

export interface Recebimento {
    id: string;
    faturamento_id?: string;
    empresa?: Empresa;
    tipo: 'faturamento' | 'avulso';
    competencia: string;
    valor_faturamento_liquido?: number;
    tem_retencao_caucao: boolean;
    perc_retencao_caucao: number;
    valor_retencao_caucao: number;
    valor_base?: number;
    acrescimo: number;
    desconto: number;
    valor_recebimento_liquido: number;
    data_recebimento?: string;
    status: 'pendente' | 'recebido';
    descricao?: string;
    observacoes?: string;
    created_at?: string;
    updated_at?: string;
    faturamentos?: Faturamento; // For join
}

export interface ContratoDocumento {
    id: string;
    contrato_id: string;
    descricao: string;
    arquivo_url: string;
    created_at?: string;
    created_by?: string;
}

export type ContratoDocumentoFormData = Omit<ContratoDocumento, 'id' | 'created_at' | 'created_by'>;

export type TipoContaFinanceira = 'corrente' | 'poupanca_aplicacao' | 'caixa_fisico';
export type StatusContaFinanceira = 'ativa' | 'inativa';

export interface ContaFinanceira {
    id: string;
    empresa: Empresa;
    nome: string;
    tipo_conta: TipoContaFinanceira;
    agencia?: string | null;
    conta?: string | null;
    chave_pix?: string | null;
    saldo_inicial: number;
    data_saldo_inicial: string;
    limite_cheque_especial: number;
    saldo_atual: number;
    status: StatusContaFinanceira;
    created_at?: string;
    updated_at?: string;
}

export type ContaFinanceiraFormData = Omit<ContaFinanceira, 'id' | 'saldo_atual' | 'created_at' | 'updated_at'>;

export type TipoAjusteSaldo = 'credito' | 'debito';

export interface ContaFinanceiraAjuste {
    id: string;
    conta_id: string;
    saldo_anterior: number;
    saldo_novo: number;
    diferenca: number;
    tipo_ajuste: TipoAjusteSaldo;
    data_ajuste: string;
    motivo?: string | null;
    usuario_id?: string | null;
    usuario_nome?: string | null;
    created_at?: string;
}

export interface AjusteSaldoFormData {
    saldo_real: number;
    data_ajuste: string;
    motivo: string;
}

// --- Categorias Financeiras ---
export type TipoCategoriaFinanceira = 'receita' | 'despesa';
export type StatusCategoriaFinanceira = 'ativa' | 'inativa';

export interface CategoriaFinanceira {
    id: string;
    parent_id: string | null;
    tipo: TipoCategoriaFinanceira;
    nome: string;
    status: StatusCategoriaFinanceira;
    created_at?: string;
    updated_at?: string;
}

export type CategoriaFinanceiraFormData = Omit<CategoriaFinanceira, 'id' | 'created_at' | 'updated_at'>;

export interface CategoriaComSubcategorias extends CategoriaFinanceira {
    subcategorias: CategoriaFinanceira[];
}

