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
