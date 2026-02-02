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
