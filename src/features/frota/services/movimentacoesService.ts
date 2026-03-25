import { normalizeSearchString } from '../../../utils/normalization';
import { supabase } from '../../../services/supabase';
import type { Movimentacao, MovimentacaoFormData, MovimentacoesFilters, PaginatedResponse } from '../types';
import { endOfMonth } from 'date-fns';

export const movimentacoesService = {
    getMovimentacoes: async (filters: MovimentacoesFilters): Promise<PaginatedResponse<Movimentacao>> => {
        const { page = 1, pageSize = 15, searchTerm, month, year } = filters;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('frota_movimentacoes')
            .select(`
                *,
                veiculo:frota_veiculos!inner(
                    id,
                    marca_modelo,
                    placa,
                    tipo,
                    abastecimento,
                    status
                )
            `, { count: 'exact' })
            .order('data_hora_inicial', { ascending: false });

        if (month && year) {
            // Use local date parsing to avoid timezone shifts where 1st of month translates to 31st of previous month
            const monthIdx = parseInt(month, 10) - 1;
            const yearNum = parseInt(year, 10);
            const startDt = new Date(yearNum, monthIdx, 1);
            const endDt = endOfMonth(startDt);

            // Format strings for Supabase GT/LT filtering (ignores TZ issues safely)
            query = query
                .gte('data_hora_inicial', startDt.toISOString())
                .lte('data_hora_inicial', endDt.toISOString());
        }

        // Se houver termo de busca, buscamos uma quantidade maior para filtrar no cliente
        if (searchTerm) {
            const { data, error } = await query; // Buscar todos (limite ~1000)

            if (error) {
                console.error('Error fetching movimentacoes for search:', error);
                throw error;
            }

            const searchNormalized = normalizeSearchString(searchTerm);

            const filteredData = (data as any[]).filter(item => {
                const responsavelMatch = normalizeSearchString(item.responsavel).includes(searchNormalized);
                const veiculoMatch = normalizeSearchString(item.veiculo?.marca_modelo).includes(searchNormalized);
                const placaMatch = normalizeSearchString(item.veiculo?.placa).includes(searchNormalized);

                return responsavelMatch || veiculoMatch || placaMatch;
            });

            const count = filteredData.length;
            const paginatedData = filteredData.slice(from, to + 1);

            return {
                data: paginatedData,
                count: count,
                page,
                totalPages: Math.ceil(count / pageSize)
            };
        }

        const { data, error, count } = await query.range(from, to);

        if (error) throw error;

        return {
            data: (data as any) || [],
            count: count || 0,
            page,
            totalPages: count ? Math.ceil(count / pageSize) : 0
        };
    },

    getMovimentacoesKpis: async (month: string, year: string, searchTerm?: string) => {
        const { data, error } = await supabase.rpc('get_movimentacoes_kpis', {
            p_month: parseInt(month, 10),
            p_year: parseInt(year, 10),
            p_search_term: searchTerm || null as any
        });

        if (error) throw error;

        return data?.[0] || {
            total_movimentacoes: 0,
            total_km_rodados: 0,
            total_consumo_kw: 0
        };
    },

    async createMovimentacao(data: MovimentacaoFormData, veiculoTipo: string, veiculoCapacidadeBateria?: number): Promise<void> {
        // Logic for mathematical rules
        const km_rodados = Number(data.km_final) - Number(data.km_inicial);

        let consumo_bateria = null;
        let consumo_kw = null;

        if (veiculoTipo === 'Elétrico') {
            const batInicial = data.bateria_inicial || 0;
            const batFinal = data.bateria_final || 0;

            consumo_bateria = batInicial - batFinal; // Ex: 100% - 80% = 20%
            consumo_kw = veiculoCapacidadeBateria ? (consumo_bateria * veiculoCapacidadeBateria) / 100 : 0;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        let responsavel = "Usuário Desconhecido";
        if (userData.user?.id) {
            const { data: profileData } = await supabase
                .from('usuarios')
                .select('nome')
                .eq('id', userData.user.id)
                .single();

            if (profileData?.nome) {
                responsavel = profileData.nome;
            } else if (userData.user.user_metadata?.nome) {
                responsavel = userData.user.user_metadata.nome;
            } else if (userData.user.email) {
                responsavel = userData.user.email.split('@')[0];
            }
        }

        const payload = {
            ...data,
            km_rodados,
            consumo_bateria,
            consumo_kw,
            responsavel
        };

        const { error } = await supabase
            .from('frota_movimentacoes')
            .insert([payload] as any);

        if (error) throw error;
    },

    async updateMovimentacao(id: string, data: MovimentacaoFormData, veiculoTipo: string, veiculoCapacidadeBateria?: number): Promise<void> {
        const km_rodados = Number(data.km_final) - Number(data.km_inicial);

        let consumo_bateria = null;
        let consumo_kw = null;

        if (veiculoTipo === 'Elétrico') {
            const batInicial = data.bateria_inicial || 0;
            const batFinal = data.bateria_final || 0;

            consumo_bateria = batInicial - batFinal;
            consumo_kw = veiculoCapacidadeBateria ? (consumo_bateria * veiculoCapacidadeBateria) / 100 : 0;
        }

        const payload = {
            ...data,
            km_rodados,
            consumo_bateria,
            consumo_kw,
        };

        const { error } = await supabase
            .from('frota_movimentacoes')
            .update(payload as any)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteMovimentacao(id: string): Promise<void> {
        const { error } = await supabase
            .from('frota_movimentacoes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
