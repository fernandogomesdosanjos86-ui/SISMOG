import { supabase } from './supabase';
import type { PostoTrabalho, PostoFormData, AlocacaoFuncionario, AlocacaoFormData } from '../features/supervisao/types';

export const supervisaoService = {
    // --- Postos de Trabalho ---
    async getPostos() {
        // Fetch postos
        const { data: postos, error } = await supabase
            .from('postos_trabalho')
            .select(`*`)
            .order('nome', { ascending: true });

        if (error) throw error;

        // Fetch all allocations to calculate counts
        // Accessing alocacoes_funcionarios once is better than N+1 queries or complex joins if data volume is reasonable
        const { data: alocacoes, error: allocError } = await supabase
            .from('alocacoes_funcionarios')
            .select('posto_id, he');

        if (allocError) throw allocError;

        // Map counts
        return postos?.map(p => {
            const postoAllocations = alocacoes?.filter(a => a.posto_id === p.id) || [];
            const qtd_oficiais = postoAllocations.filter(a => !a.he).length;
            const qtd_he = postoAllocations.filter(a => a.he).length;

            return {
                ...p,
                allocations_count: postoAllocations.length,
                qtd_oficiais,
                qtd_he
            };
        }) as PostoTrabalho[];
    },

    async createPosto(data: PostoFormData) {
        const { data: newPosto, error } = await supabase
            .from('postos_trabalho')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return newPosto;
    },

    async updatePosto(id: string, data: Partial<PostoFormData>) {
        const { error } = await supabase
            .from('postos_trabalho')
            .update(data)
            .eq('id', id);

        if (error) throw error;
    },

    async deletePosto(id: string) {
        const { error } = await supabase
            .from('postos_trabalho')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Alocações ---
    async getAlocacoes(postoId: string) {
        const { data, error } = await supabase
            .from('alocacoes_funcionarios')
            .select(`
                *,
                funcionario:funcionarios(
                    nome,
                    cargo:cargos_salarios(cargo)
                )
            `)
            .eq('posto_id', postoId)
            // Order by HE=false first, then name
            .order('he', { ascending: true })
            // We can't easily order by joined column 'funcionario.nome' in simple query, 
            // usually requires rpc or client side sort. We'll sort by created_at secondary for now 
            // or do client side sort.
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AlocacaoFuncionario[];
    },

    async createAlocacao(data: AlocacaoFormData) {
        // Check uniqueness constraint logic is handled by DB Index (unique_main_allocation_per_employee)
        const { data: newAlloc, error } = await supabase
            .from('alocacoes_funcionarios')
            .insert(data)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Este funcionário já possui uma alocação principal (sem HE) em outro posto.');
            }
            throw error;
        }
        return newAlloc;
    },

    async updateAlocacao(id: string, data: Partial<AlocacaoFormData>) {
        const { error } = await supabase
            .from('alocacoes_funcionarios')
            .update(data)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteAlocacao(id: string) {
        const { error } = await supabase
            .from('alocacoes_funcionarios')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
