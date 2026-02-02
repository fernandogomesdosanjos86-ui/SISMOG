import type { Contrato } from '../financeiro/types';

export type EquipamentoCategoria = 'Armamentos' | 'Coletes Balísticos' | 'Munições';
export type EquipamentoStatus = 'Ativo' | 'Inativo';

export interface Equipamento {
    id: string;
    categoria: EquipamentoCategoria;
    descricao: string;
    identificacao?: string;
    quantidade: number;
    status: EquipamentoStatus;
    created_at?: string;
    // Virtual fields (calculated)
    total_destinado?: number;
    disponivel?: number;
}

export interface EquipamentoDestinacao {
    id: string;
    equipamento_id: string;
    contrato_id: string;
    quantidade: number;
    created_at?: string;
    // Joins
    equipamentos?: Equipamento;
    contratos?: Contrato;
}
