import { supabase } from '../lib/supabase';

/**
 * Service para gerenciar recebimentos
 * Auto-criados a partir de faturamentos
 */
export const recebimentosService = {
    /**
     * Lista todos os recebimentos com joins
     */
    async getAll(competencia = null, empresaId = null) {
        let query = supabase
            .from('recebimentos')
            .select(`
                *,
                empresas:empresa_id (id, nome_empresa),
                contratos:contrato_id (id, posto_trabalho),
                faturamentos:faturamento_id (id, competencia, status)
            `)
            .is('deleted_at', null)
            .order('data_vencimento', { ascending: true });

        if (empresaId && empresaId !== 'all') {
            query = query.eq('empresa_id', empresaId);
        }

        // Filtro por competência do faturamento relacionado
        if (competencia) {
            // Busca faturamentos da competência primeiro
            const { data: fats } = await supabase
                .from('faturamentos')
                .select('id')
                .gte('competencia', `${competencia}-01`)
                .lt('competencia', `${competencia}-32`);

            if (fats && fats.length > 0) {
                const fatIds = fats.map(f => f.id);
                query = query.in('faturamento_id', fatIds);
            } else {
                return { data: [], error: null };
            }
        }

        const { data, error } = await query;
        return { data, error };
    },

    /**
     * Busca recebimento por ID do faturamento
     */
    async getByFaturamentoId(faturamentoId) {
        const { data, error } = await supabase
            .from('recebimentos')
            .select('*')
            .eq('faturamento_id', faturamentoId)
            .is('deleted_at', null)
            .single();

        return { data, error };
    },

    /**
     * Cria um novo recebimento (chamado automaticamente ao faturar)
     */
    async create(data) {
        const payload = {
            faturamento_id: data.faturamento_id,
            empresa_id: data.empresa_id,
            contrato_id: data.contrato_id,
            posto: data.posto,
            data_vencimento: data.data_vencimento,
            valor_receb: data.valor_receb,
            status: 'Pendente',
            tipo: data.tipo || 'Faturamento',
            observacoes: data.observacoes || null
        };

        const { data: result, error } = await supabase
            .from('recebimentos')
            .insert(payload)
            .select()
            .single();

        return { data: result, error };
    },

    /**
     * Cria um recebimento avulso (independente de faturamento)
     */
    async createAvulso(data) {
        const payload = {
            empresa_id: data.empresa_id,
            posto: data.posto || 'Recebimento Avulso',
            data_vencimento: data.data_vencimento,
            valor_receb: data.valor_receb,
            status: 'Pendente',
            tipo: 'Avulso',
            observacoes: data.observacoes || null,
            // faturamento_id e contrato_id são null para avulsos
            faturamento_id: null,
            contrato_id: null
        };

        const { data: result, error } = await supabase
            .from('recebimentos')
            .insert(payload)
            .select()
            .single();

        return { data: result, error };
    },

    /**
     * Atualiza um recebimento (ex: marcar como recebido)
     */
    async update(id, data) {
        const payload = {
            status: data.status,
            data_recebimento: data.data_recebimento || null,
            observacoes: data.observacoes || null,
            updated_at: new Date().toISOString()
        };

        // Adiciona valor_receb se fornecido
        if (data.valor_receb !== undefined) {
            payload.valor_receb = data.valor_receb;
        }

        const { data: result, error } = await supabase
            .from('recebimentos')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        return { data: result, error };
    },

    /**
     * Marca recebimento como recebido
     */
    async marcarRecebido(id) {
        const { data, error } = await supabase
            .from('recebimentos')
            .update({
                status: 'Recebido',
                data_recebimento: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Desfaz recebimento (volta para Pendente)
     */
    async desfazerRecebimento(id) {
        const { data, error } = await supabase
            .from('recebimentos')
            .update({
                status: 'Pendente',
                data_recebimento: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Soft delete de um recebimento
     */
    async delete(id) {
        const { error } = await supabase
            .from('recebimentos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return { error };
    },

    /**
     * Exclui recebimento por faturamento_id (usado ao desfazer faturamento)
     * Hard delete pois o faturamento está sendo desfeito
     */
    async deleteByFaturamentoId(faturamentoId) {
        const { error } = await supabase
            .from('recebimentos')
            .delete()
            .eq('faturamento_id', faturamentoId);

        return { error };
    },

    /**
     * Cria recebimento a partir de dados do faturamento
     */
    async createFromFaturamento(faturamento) {
        const payload = {
            faturamento_id: faturamento.id,
            empresa_id: faturamento.empresa_id,
            contrato_id: faturamento.contrato_id,
            posto: faturamento.contratos?.posto_trabalho || faturamento.posto || 'N/A',
            data_vencimento: faturamento.data_vencimento,
            valor_receb: faturamento.valor_recebimento,
            status: 'Pendente'
        };

        return this.create(payload);
    }
};

export default recebimentosService;
