import { supabase } from '../../../services/supabase';
import type { TrocaPlantao, TrocaPlantaoFormData, StatusTrocaPlantao } from '../types';

export const trocaPlantaoService = {
    async getTrocasPlantao(options?: { monthYear?: string; empresa?: 'FEMOG' | 'SEMOG'; searchTerm?: string }) {
        let query = supabase
            .from('supervisao_trocas_plantao')
            .select(`
                *,
                funcionario:funcionarios!funcionario_id(nome, cpf),
                posto:postos_trabalho!posto_id(nome),
                funcionario_troca:funcionarios!funcionario_troca_id(nome, cpf),
                solicitante:usuarios!solicitante_id(nome),
                responsavel_analise:usuarios!responsavel_analise_id(nome)
            `)
            .order('data_original', { ascending: true }); // "Ordenar por data original"

        // Exemplo: '2026-03'
        if (options?.monthYear) {
            const startDate = `${options.monthYear}-01`;
            
            // To get last day of month easily in SQL:
            // We can just filter >= YYYY-MM-01 and < next month
            const year = parseInt(options.monthYear.substring(0, 4));
            const month = parseInt(options.monthYear.substring(5, 7));
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];
            
            query = query.or(`and(data_original.gte.${startDate},data_original.lte.${endDate}),and(data_reposicao.gte.${startDate},data_reposicao.lte.${endDate})`);
        }

        if (options?.empresa) {
            query = query.eq('empresa', options.empresa);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Custom search since text search across relationships isn't perfectly supported via pure Postgrest syntax here seamlessly
        let filteredData = data as unknown as TrocaPlantao[];
        
        if (options?.searchTerm) {
            const normalizeStr = (str?: string | null) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
            const term = normalizeStr(options.searchTerm);
            
            filteredData = filteredData.filter(t => 
                normalizeStr(t.funcionario?.nome).includes(term) ||
                normalizeStr(t.funcionario_troca?.nome).includes(term) ||
                normalizeStr(t.solicitante?.nome).includes(term) ||
                normalizeStr(t.posto?.nome).includes(term)
            );
        }

        return filteredData;
    },

    async getMesesComLancamento() {
        // Obter datas distintas para o seletor
        const { data, error } = await supabase
            .from('supervisao_trocas_plantao')
            .select('data_original');

        if (error) throw error;

        const months = new Set<string>();
        data?.forEach(t => {
            if (t.data_original) {
                months.add(t.data_original.substring(0, 7)); // YYYY-MM
            }
        });

        return Array.from(months).sort().reverse(); // Decrescente
    },

    async createTroca(data: TrocaPlantaoFormData) {
        const { data: created, error } = await supabase
            .from('supervisao_trocas_plantao')
            .insert(data as any)
            .select()
            .single();

        if (error) throw error;
        return created as unknown as TrocaPlantao;
    },

    async updateTroca(id: string, data: Partial<TrocaPlantaoFormData>) {
        const { data: updated, error } = await supabase
            .from('supervisao_trocas_plantao')
            .update(data as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return updated as unknown as TrocaPlantao;
    },

    async cancelarTroca(id: string) {
        const { error } = await supabase
            .from('supervisao_trocas_plantao')
            .update({ status: 'Cancelado' })
            .eq('id', id);

        if (error) throw error;
    },

    async aceitarCobertura(id: string, aceito: boolean) {
        const payload: { de_acordo: boolean; status: StatusTrocaPlantao } = {
            de_acordo: aceito,
            status: aceito ? 'Em Análise' : 'Cancelado'
        };

        const { error } = await supabase
            .from('supervisao_trocas_plantao')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    async aprovarReprovarTroca(id: string, aprovado: boolean, responsavelId: string) {
        const payload: { status: StatusTrocaPlantao; data_analise: string; responsavel_analise_id: string } = {
            status: aprovado ? 'Autorizado' : 'Negado',
            data_analise: new Date().toISOString(),
            responsavel_analise_id: responsavelId
        };

        const { error } = await supabase
            .from('supervisao_trocas_plantao')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteTroca(id: string) {
        const { error } = await supabase
            .from('supervisao_trocas_plantao')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
