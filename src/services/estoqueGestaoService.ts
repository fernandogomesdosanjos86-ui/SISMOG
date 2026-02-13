import { supabase } from './supabase';
import type { Produto, ProdutoFormData, Movimentacao, MovimentacaoFormData } from '../features/estoque/gestao/types';

export const estoqueGestaoService = {
    // ========== PRODUTOS ==========

    async getProdutos(): Promise<(Produto & { em_estoque: number })[]> {
        const { data: produtos, error } = await supabase
            .from('estoque_produtos')
            .select('*')
            .order('codigo');

        if (error) throw error;

        // Calculate stock for each product
        const { data: movimentacoes, error: movError } = await supabase
            .from('estoque_movimentacoes')
            .select('produto_id, tipo, quantidade');

        if (movError) throw movError;

        const saldoMap: Record<string, number> = {};
        (movimentacoes || []).forEach(m => {
            if (!saldoMap[m.produto_id]) saldoMap[m.produto_id] = 0;
            if (m.tipo === 'Compra' || m.tipo === 'Devolução') {
                saldoMap[m.produto_id] += m.quantidade;
            } else {
                saldoMap[m.produto_id] -= m.quantidade;
            }
        });

        return (produtos || []).map(p => ({
            ...p,
            em_estoque: saldoMap[p.id] || 0,
        }));
    },

    generateCodigo(produto: string, cor?: string, tamanho?: string): string {
        return [produto, cor, tamanho].filter(Boolean).join(' ').toUpperCase().trim().replace(/\s+/g, ' ');
    },

    async createProduto(data: ProdutoFormData) {
        const codigo = this.generateCodigo(data.produto, data.cor, data.tamanho);

        // Check uniqueness
        const { data: existing } = await supabase
            .from('estoque_produtos')
            .select('id')
            .eq('codigo', codigo)
            .maybeSingle();

        if (existing) {
            throw new Error(`Produto com código "${codigo}" já existe.`);
        }

        const { data: result, error } = await supabase
            .from('estoque_produtos')
            .insert({ ...data, codigo })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateProduto(id: string, data: ProdutoFormData) {
        const codigo = this.generateCodigo(data.produto, data.cor, data.tamanho);

        // Check uniqueness (exclude self)
        const { data: existing } = await supabase
            .from('estoque_produtos')
            .select('id')
            .eq('codigo', codigo)
            .neq('id', id)
            .maybeSingle();

        if (existing) {
            throw new Error(`Produto com código "${codigo}" já existe.`);
        }

        const { data: result, error } = await supabase
            .from('estoque_produtos')
            .update({ ...data, codigo })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async deleteProduto(id: string) {
        // Check for existing movements
        const { count, error: countError } = await supabase
            .from('estoque_movimentacoes')
            .select('id', { count: 'exact', head: true })
            .eq('produto_id', id);

        if (countError) throw countError;
        if (count && count > 0) {
            throw new Error('Não é possível excluir produto com movimentações registradas.');
        }

        const { error } = await supabase
            .from('estoque_produtos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ========== MOVIMENTAÇÕES ==========

    async getMovimentacoes() {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select(`
                *,
                produto:estoque_produtos(id, codigo, tipo),
                funcionario:funcionarios(id, nome, empresa),
                posto:postos_trabalho(id, nome, empresa)
            `)
            .order('data', { ascending: false });

        if (error) throw error;
        return data as Movimentacao[];
    },

    async getSaldoEstoque(produtoId: string): Promise<number> {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select('tipo, quantidade')
            .eq('produto_id', produtoId);

        if (error) throw error;

        let saldo = 0;
        (data || []).forEach(m => {
            if (m.tipo === 'Compra' || m.tipo === 'Devolução') saldo += m.quantidade;
            else saldo -= m.quantidade;
        });
        return saldo;
    },

    async getSaldoFuncionario(funcionarioId: string, produtoId: string): Promise<number> {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select('tipo, quantidade')
            .eq('produto_id', produtoId)
            .eq('funcionario_id', funcionarioId)
            .in('tipo', ['Entrega', 'Devolução']);

        if (error) throw error;

        let saldo = 0;
        (data || []).forEach(m => {
            if (m.tipo === 'Entrega') saldo += m.quantidade;
            else saldo -= m.quantidade; // Devolução
        });
        return saldo;
    },

    async getSaldoPosto(postoId: string, produtoId: string): Promise<number> {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select('tipo, quantidade')
            .eq('produto_id', produtoId)
            .eq('posto_id', postoId)
            .in('tipo', ['Entrega', 'Devolução']);

        if (error) throw error;

        let saldo = 0;
        (data || []).forEach(m => {
            if (m.tipo === 'Entrega') saldo += m.quantidade;
            else saldo -= m.quantidade;
        });
        return saldo;
    },

    async createMovimentacao(data: MovimentacaoFormData) {
        // Validation: Entrega/Descarte → check stock
        if (data.tipo === 'Entrega' || data.tipo === 'Descarte') {
            const saldo = await this.getSaldoEstoque(data.produto_id);
            if (data.quantidade > saldo) {
                throw new Error(`Estoque insuficiente. Saldo atual: ${saldo}`);
            }
        }

        // Validation: Devolução → check holder's balance
        if (data.tipo === 'Devolução') {
            if (data.funcionario_id) {
                const saldo = await this.getSaldoFuncionario(data.funcionario_id, data.produto_id);
                if (data.quantidade > saldo) {
                    throw new Error(`Funcionário possui apenas ${saldo} unidade(s) deste item.`);
                }
            } else if (data.posto_id) {
                const saldo = await this.getSaldoPosto(data.posto_id, data.produto_id);
                if (data.quantidade > saldo) {
                    throw new Error(`Posto possui apenas ${saldo} unidade(s) deste item.`);
                }
            }
        }

        const { data: result, error } = await supabase
            .from('estoque_movimentacoes')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateMovimentacao(id: string, data: Partial<MovimentacaoFormData>) {
        const { data: result, error } = await supabase
            .from('estoque_movimentacoes')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async deleteMovimentacao(id: string) {
        const { error } = await supabase
            .from('estoque_movimentacoes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ========== RESUMOS AGRUPADOS ==========

    async getResumoPorFuncionario() {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select(`
                funcionario_id,
                tipo,
                quantidade,
                funcionario:funcionarios(id, nome, empresa)
            `)
            .not('funcionario_id', 'is', null)
            .in('tipo', ['Entrega', 'Devolução']);

        if (error) throw error;

        const map: Record<string, { nome: string; empresa: string; qtd: number }> = {};
        (data || []).forEach(m => {
            const fId = m.funcionario_id!;
            if (!map[fId]) {
                map[fId] = {
                    nome: (m.funcionario as any)?.nome || '',
                    empresa: (m.funcionario as any)?.empresa || '',
                    qtd: 0,
                };
            }
            if (m.tipo === 'Entrega') map[fId].qtd += m.quantidade;
            else map[fId].qtd -= m.quantidade;
        });

        return Object.entries(map)
            .filter(([_, v]) => v.qtd > 0)
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => a.nome.localeCompare(b.nome));
    },

    async getResumoPorPosto() {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select(`
                posto_id,
                tipo,
                quantidade,
                posto:postos_trabalho(id, nome, empresa)
            `)
            .not('posto_id', 'is', null)
            .in('tipo', ['Entrega', 'Devolução']);

        if (error) throw error;

        const map: Record<string, { nome: string; empresa: string; qtd: number }> = {};
        (data || []).forEach(m => {
            const pId = m.posto_id!;
            if (!map[pId]) {
                map[pId] = {
                    nome: (m.posto as any)?.nome || '',
                    empresa: (m.posto as any)?.empresa || '',
                    qtd: 0,
                };
            }
            if (m.tipo === 'Entrega') map[pId].qtd += m.quantidade;
            else map[pId].qtd -= m.quantidade;
        });

        return Object.entries(map)
            .filter(([_, v]) => v.qtd > 0)
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => a.nome.localeCompare(b.nome));
    },

    async getMovimentacoesPorFuncionario(funcionarioId: string) {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select(`
                *,
                produto:estoque_produtos(id, codigo, tipo)
            `)
            .eq('funcionario_id', funcionarioId)
            .in('tipo', ['Entrega', 'Devolução'])
            .order('data', { ascending: false });

        if (error) throw error;
        return data as Movimentacao[];
    },

    async getMovimentacoesPorPosto(postoId: string) {
        const { data, error } = await supabase
            .from('estoque_movimentacoes')
            .select(`
                *,
                produto:estoque_produtos(id, codigo, tipo)
            `)
            .eq('posto_id', postoId)
            .in('tipo', ['Entrega', 'Devolução'])
            .order('data', { ascending: false });

        if (error) throw error;
        return data as Movimentacao[];
    },
};
