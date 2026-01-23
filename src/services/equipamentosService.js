import { supabase } from '../lib/supabase';

export const equipamentosService = {
    /**
     * Lista todos os equipamentos com filtro opcional por categoria
     */
    async getAll(categoria = null) {
        let query = supabase
            .from('equipamentos')
            .select('*')
            .is('deleted_at', null)
            .order('categoria', { ascending: true })
            .order('descricao', { ascending: true });

        if (categoria) {
            query = query.eq('categoria', categoria);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Lista distribuição com joins
     */
    async getDistribuicao() {
        const { data, error } = await supabase
            .from('equipamentos_distribuicao')
            .select(`
                *,
                equipamentos (id, categoria, descricao, identificacao),
                contratos (id, posto_trabalho, empresas (id, nome_empresa))
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Busca postos de contratos ativos da Femog
     */
    async getPostosFemog() {
        const { data, error } = await supabase
            .from('contratos')
            .select(`
                id,
                posto_trabalho,
                empresas (id, nome_empresa)
            `)
            .eq('ativo', true)
            .ilike('empresas.nome_empresa', '%femog%')
            .is('deleted_at', null)
            .order('posto_trabalho', { ascending: true });

        if (error) throw error;
        // Filtra apenas os que têm empresa Femog
        return (data || []).filter(c => c.empresas?.nome_empresa?.toLowerCase().includes('femog'));
    },

    /**
     * Busca equipamento por ID
     */
    async getById(id) {
        const { data, error } = await supabase
            .from('equipamentos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Cria novo equipamento
     */
    async create(data) {
        const payload = {
            categoria: data.categoria,
            descricao: data.descricao,
            identificacao: data.identificacao || null,
            quantidade: data.quantidade || 1,
            quantidade_disponivel: data.quantidade || 1,
            ativo: data.ativo !== false
        };

        const { data: result, error } = await supabase
            .from('equipamentos')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Atualiza equipamento
     */
    async update(id, data) {
        const payload = {
            categoria: data.categoria,
            descricao: data.descricao,
            identificacao: data.identificacao || null,
            quantidade: data.quantidade || 1,
            ativo: data.ativo,
            updated_at: new Date().toISOString()
        };

        const { data: result, error } = await supabase
            .from('equipamentos')
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
            .from('equipamentos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Destina equipamento a um posto
     */
    async destinar(equipamentoId, contratoId, quantidade = 1) {
        // 1. Busca equipamento atual
        const equipamento = await this.getById(equipamentoId);
        if (!equipamento) throw new Error('Equipamento não encontrado');
        if (equipamento.quantidade_disponivel < quantidade) {
            throw new Error('Quantidade insuficiente em estoque');
        }

        // 2. Verifica se já existe distribuição para este equipamento/contrato
        const { data: existente } = await supabase
            .from('equipamentos_distribuicao')
            .select('*')
            .eq('equipamento_id', equipamentoId)
            .eq('contrato_id', contratoId)
            .single();

        if (existente) {
            // Atualiza quantidade
            await supabase
                .from('equipamentos_distribuicao')
                .update({
                    quantidade: existente.quantidade + quantidade,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existente.id);
        } else {
            // Cria nova distribuição
            await supabase
                .from('equipamentos_distribuicao')
                .insert({
                    equipamento_id: equipamentoId,
                    contrato_id: contratoId,
                    quantidade: quantidade
                });
        }

        // 3. Atualiza saldo disponível
        await supabase
            .from('equipamentos')
            .update({
                quantidade_disponivel: equipamento.quantidade_disponivel - quantidade,
                updated_at: new Date().toISOString()
            })
            .eq('id', equipamentoId);

        return true;
    },

    /**
     * Devolve equipamento ao estoque
     */
    async devolver(distribuicaoId, quantidade = 1) {
        // 1. Busca distribuição
        const { data: distribuicao, error: errDist } = await supabase
            .from('equipamentos_distribuicao')
            .select('*, equipamentos(*)')
            .eq('id', distribuicaoId)
            .single();

        if (errDist || !distribuicao) throw new Error('Distribuição não encontrada');
        if (distribuicao.quantidade < quantidade) {
            throw new Error('Quantidade a devolver maior que o disponível no posto');
        }

        const novaQtd = distribuicao.quantidade - quantidade;

        if (novaQtd <= 0) {
            // Remove a distribuição
            await supabase
                .from('equipamentos_distribuicao')
                .delete()
                .eq('id', distribuicaoId);
        } else {
            // Atualiza quantidade
            await supabase
                .from('equipamentos_distribuicao')
                .update({
                    quantidade: novaQtd,
                    updated_at: new Date().toISOString()
                })
                .eq('id', distribuicaoId);
        }

        // 2. Devolve ao estoque
        await supabase
            .from('equipamentos')
            .update({
                quantidade_disponivel: distribuicao.equipamentos.quantidade_disponivel + quantidade,
                updated_at: new Date().toISOString()
            })
            .eq('id', distribuicao.equipamento_id);

        return true;
    },

    /**
     * Calcula estatísticas para os KPIs
     */
    async getStats() {
        const equipamentos = await this.getAll();

        const stats = {
            armamentos: { emEstoque: 0, emUso: 0, total: 0 },
            coletes: { emEstoque: 0, emUso: 0, total: 0 },
            municoes: { emEstoque: 0, emUso: 0, total: 0 }
        };

        equipamentos.forEach(eq => {
            const key = eq.categoria === 'Armamento' ? 'armamentos'
                : eq.categoria === 'Colete' ? 'coletes'
                    : 'municoes';

            stats[key].emEstoque += eq.quantidade_disponivel;
            stats[key].emUso += (eq.quantidade - eq.quantidade_disponivel);
            stats[key].total += eq.quantidade;
        });

        return stats;
    }
};
