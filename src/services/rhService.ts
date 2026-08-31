import { supabase } from './supabase';
import type { CargoSalario, Funcionario, FuncionarioFormData } from '../features/rh/types';

const formatarNome = (str: string) => {
    if (!str) return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

export const rhService = {
    async getCargosSalarios() {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .select('id, cargo, empresa, uf, salario_base, perc_insalubridade, perc_periculosidade, perc_adc_noturno, perc_intrajornada, valor_aux_alim, perc_desc_alim, valor_he_diurno, valor_he_noturno, created_at, updated_at')
            .order('cargo', { ascending: true })
            .order('uf', { ascending: true });

        if (error) throw error;
        return data as CargoSalario[];
    },

    async createCargoSalario(cargo: Omit<CargoSalario, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .insert(cargo)
            .select()
            .single();

        if (error) throw error;
        return data as CargoSalario;
    },

    async updateCargoSalario(id: string, cargo: Partial<CargoSalario>) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .update(cargo)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CargoSalario;
    },

    async deleteCargoSalario(id: string) {
        const { error } = await supabase
            .from('cargos_salarios')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Funcionários ---
    async getFuncionarios() {
        const { data, error } = await supabase
            .from('funcionarios')
            .select('id, empresa, nome, cpf, cargo_id, tipo_contrato, banco, agencia, conta, pix, uniforme, valor_transporte_dia, valor_combustivel_dia, status, data_admissao, data_desligamento, created_at, updated_at, cargos_salarios(cargo, uf)')
            .order('nome', { ascending: true });

        if (error) throw error;
        const result = data as Funcionario[];
        return result.map(f => ({
            ...f,
            nome: formatarNome(f.nome)
        }));
    },

    async createFuncionario(funcionario: FuncionarioFormData) {
        const payload = {
            ...funcionario,
            data_admissao: funcionario.data_admissao || null,
            data_desligamento: funcionario.data_desligamento || null,
            nome: formatarNome(funcionario.nome)
        };

        const { data, error } = await supabase
            .from('funcionarios')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as Funcionario;
    },

    async updateFuncionario(id: string, funcionario: Partial<Funcionario>) {
        const payload = { ...funcionario };
        if (payload.nome) {
            payload.nome = formatarNome(payload.nome);
        }
        if (payload.data_admissao === '') {
            payload.data_admissao = null;
        }
        if (payload.data_desligamento === '') {
            payload.data_desligamento = null;
        }

        const { data, error } = await supabase
            .from('funcionarios')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Funcionario;
    },

    async deleteFuncionario(id: string) {
        const { error } = await supabase
            .from('funcionarios')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
