import { supabase } from '../lib/supabase';

export const estoqueService = {
    // ============ CATEGORIAS ============
    async getCategorias() {
        const { data, error } = await supabase
            .from('estoque_categorias')
            .select('*')
            .is('deleted_at', null)
            .order('nome');
        if (error) throw error;
        return data || [];
    },

    async createCategoria(nome, tipo) {
        const { data, error } = await supabase
            .from('estoque_categorias')
            .insert({ nome, tipo })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ============ PRODUTOS ============
    async getProdutos() {
        const { data, error } = await supabase
            .from('estoque_produtos')
            .select(`
                *,
                estoque_categorias (id, nome, tipo)
            `)
            .is('deleted_at', null)
            .order('descricao');
        if (error) throw error;
        return data || [];
    },

    async getProdutoById(id) {
        const { data, error } = await supabase
            .from('estoque_produtos')
            .select(`*, estoque_categorias (id, nome, tipo)`)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async createProduto(categoriaId, descricao) {
        const { data, error } = await supabase
            .from('estoque_produtos')
            .insert({ categoria_id: categoriaId, descricao })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateProduto(id, payload) {
        const { data, error } = await supabase
            .from('estoque_produtos')
            .update({ categoria_id: payload.categoria_id, descricao: payload.descricao })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteProduto(id) {
        const { error } = await supabase
            .from('estoque_produtos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    // ============ LOTES ============
    async getLotes(produtoId = null) {
        let query = supabase
            .from('estoque_lotes')
            .select(`*, estoque_produtos (id, descricao, estoque_categorias (id, nome, tipo))`)
            .order('data_entrada', { ascending: false });

        if (produtoId) query = query.eq('produto_id', produtoId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async createLote(produtoId, quantidade, dataEntrada) {
        const { data, error } = await supabase
            .from('estoque_lotes')
            .insert({ produto_id: produtoId, quantidade, data_entrada: dataEntrada })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ============ MOVIMENTAÇÕES ============
    async getMovimentacoes(tipo = null) {
        let query = supabase
            .from('estoque_movimentacoes')
            .select(`
                *,
                estoque_produtos (id, descricao, estoque_categorias (id, nome, tipo)),
                funcionarios (id, nome),
                contratos (id, posto_trabalho, empresas (id, nome_empresa))
            `)
            .order('data_movimentacao', { ascending: false });

        if (tipo) query = query.eq('tipo_mov', tipo);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getMovimentacoesIndividuais() {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select(`
                *,
                estoque_produtos (id, descricao, estoque_categorias (id, nome, tipo)),
                funcionarios (id, nome)
            `)
            .not('funcionario_id', 'is', null)
            .order('data_movimentacao', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getMovimentacoesColetivas() {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select(`
                *,
                estoque_produtos (id, descricao, estoque_categorias (id, nome, tipo)),
                contratos (id, posto_trabalho, empresas (id, nome_empresa))
            `)
            .not('contrato_id', 'is', null)
            .order('data_movimentacao', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    // ============ ENTREGA ============
    async entregar(produtoId, quantidade, dataMovimentacao, funcionarioId = null, contratoId = null) {
        const disponivel = await this.getQuantidadeDisponivel(produtoId);
        if (quantidade > disponivel) throw new Error('Quantidade insuficiente em estoque');

        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .insert({
                produto_id: produtoId,
                tipo_mov: 'Entrega',
                quantidade,
                data_movimentacao: dataMovimentacao,
                funcionario_id: funcionarioId || null,
                contrato_id: contratoId || null
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ============ DEVOLUÇÃO ============
    async devolver(produtoId, quantidade, dataMovimentacao, funcionarioId = null, contratoId = null) {
        const possui = await this.getQuantidadePossui(produtoId, funcionarioId, contratoId);
        if (quantidade > possui) throw new Error('Quantidade maior do que o que possui');

        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .insert({
                produto_id: produtoId,
                tipo_mov: 'Devolução',
                quantidade,
                data_movimentacao: dataMovimentacao,
                funcionario_id: funcionarioId || null,
                contrato_id: contratoId || null
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ============ DESCARTE ============
    async descartar(produtoId, quantidade, dataMovimentacao, motivo) {
        const disponivel = await this.getQuantidadeDisponivel(produtoId);
        if (quantidade > disponivel) throw new Error('Quantidade insuficiente em estoque');

        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .insert({
                produto_id: produtoId,
                tipo_mov: 'Descarte',
                quantidade,
                data_movimentacao: dataMovimentacao,
                motivo
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ============ CÁLCULOS ============
    async getQuantidadeDisponivel(produtoId) {
        // Soma lotes
        const { data: lotes } = await supabase
            .from('estoque_lotes')
            .select('quantidade')
            .eq('produto_id', produtoId);
        const totalLotes = (lotes || []).reduce((acc, l) => acc + l.quantidade, 0);

        // Soma movimentações
        const { data: movs } = await supabase
            .from('estoque_movimentacoes')
            .select('tipo_mov, quantidade')
            .eq('produto_id', produtoId);

        let entregas = 0, devolucoes = 0, descartes = 0;
        (movs || []).forEach(m => {
            if (m.tipo_mov === 'Entrega') entregas += m.quantidade;
            if (m.tipo_mov === 'Devolução') devolucoes += m.quantidade;
            if (m.tipo_mov === 'Descarte') descartes += m.quantidade;
        });

        return totalLotes - entregas + devolucoes - descartes;
    },

    async getQuantidadePossui(produtoId, funcionarioId = null, contratoId = null) {
        const filter = funcionarioId
            ? { funcionario_id: funcionarioId }
            : { contrato_id: contratoId };

        const { data: movs } = await supabase
            .from('estoque_movimentacoes')
            .select('tipo_mov, quantidade')
            .eq('produto_id', produtoId)
            .match(filter);

        let entregas = 0, devolucoes = 0;
        (movs || []).forEach(m => {
            if (m.tipo_mov === 'Entrega') entregas += m.quantidade;
            if (m.tipo_mov === 'Devolução') devolucoes += m.quantidade;
        });

        return entregas - devolucoes;
    },

    // Retorna produtos com quantidade calculada
    async getProdutosComEstoque() {
        const produtos = await this.getProdutos();
        const lotes = await this.getLotes();

        const produtosComEstoque = await Promise.all(produtos.map(async (p) => {
            const disponivel = await this.getQuantidadeDisponivel(p.id);
            const lotesP = lotes.filter(l => l.produto_id === p.id);
            const ultimoLote = lotesP.length > 0 ? lotesP[0].data_entrada : null;
            return { ...p, quantidade_disponivel: disponivel, ultimo_lote: ultimoLote };
        }));

        return produtosComEstoque;
    },

    // Lista produtos que funcionário/posto possui
    async getProdutosPossui(funcionarioId = null, contratoId = null) {
        const produtos = await this.getProdutos();
        const result = [];

        for (const p of produtos) {
            const qtd = await this.getQuantidadePossui(p.id, funcionarioId, contratoId);
            if (qtd > 0) {
                result.push({ ...p, quantidade_possui: qtd });
            }
        }
        return result;
    }
};
