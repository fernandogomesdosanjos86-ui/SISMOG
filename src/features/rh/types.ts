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
    status: 'ativo' | 'inativo' | 'ferias' | 'afastado';
    // Joined fields
    cargo?: {
        cargo: string;
    };
    created_at?: string;
    updated_at?: string;
    cargos_salarios?: CargoSalario; // Joined relation
}

export type FuncionarioFormData = Omit<Funcionario, 'id' | 'created_at' | 'updated_at' | 'cargos_salarios'>;
