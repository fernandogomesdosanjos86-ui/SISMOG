import { supabase } from '../lib/supabase';

export const funcionariosService = {
    /**
     * Lista funcionários com filtro por empresa
     */
    async getAll(empresaId = null) {
        let query = supabase
            .from('funcionarios')
            .select(`
                *,
                empresas (id, nome_empresa),
                cargos_salarios (id, cargo, uf)
            `)
            .is('deleted_at', null)
            .order('nome', { ascending: true });

        if (empresaId) {
            query = query.eq('empresa_id', empresaId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Busca por ID
     */
    async getById(id) {
        const { data, error } = await supabase
            .from('funcionarios')
            .select(`
                *,
                empresas (id, nome_empresa),
                cargos_salarios (id, cargo, uf)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Cria funcionário
     */
    async create(data) {
        const payload = {
            empresa_id: data.empresa_id,
            matricula: data.matricula || null,
            nome: data.nome,
            tipo_contrato: data.tipo_contrato,
            cargo_id: data.cargo_id || null,
            ativo: data.ativo !== false,
            camisa: data.camisa || null,
            calca: data.calca || null,
            calcado: data.calcado || null,
            data_nascimento: data.data_nascimento || null,
            rg: data.rg || null,
            cpf: data.cpf || null,
            telefone: data.telefone || null,
            email: data.email || null,
            banco: data.banco || null,
            agencia: data.agencia || null,
            conta_corrente: data.conta_corrente || null,
            pix: data.pix || null
        };

        const { data: result, error } = await supabase
            .from('funcionarios')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Atualiza funcionário
     */
    async update(id, data) {
        const payload = {
            empresa_id: data.empresa_id,
            matricula: data.matricula || null,
            nome: data.nome,
            tipo_contrato: data.tipo_contrato,
            cargo_id: data.cargo_id || null,
            ativo: data.ativo,
            camisa: data.camisa || null,
            calca: data.calca || null,
            calcado: data.calcado || null,
            data_nascimento: data.data_nascimento || null,
            rg: data.rg || null,
            cpf: data.cpf || null,
            telefone: data.telefone || null,
            email: data.email || null,
            banco: data.banco || null,
            agencia: data.agencia || null,
            conta_corrente: data.conta_corrente || null,
            pix: data.pix || null,
            updated_at: new Date().toISOString()
        };

        const { data: result, error } = await supabase
            .from('funcionarios')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Soft delete
     */
    async delete(id) {
        const { error } = await supabase
            .from('funcionarios')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Estatísticas para KPIs
     */
    async getStats(empresas = []) {
        const funcionarios = await this.getAll();
        const ativos = funcionarios.filter(f => f.ativo);

        const stats = {
            total: ativos.length,
            porEmpresa: {}
        };

        empresas.forEach(emp => {
            stats.porEmpresa[emp.id] = ativos.filter(f => f.empresa_id === emp.id).length;
        });

        return stats;
    }
};
