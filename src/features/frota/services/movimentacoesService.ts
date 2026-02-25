import { supabase } from '../../../services/supabase';
import type { Movimentacao, MovimentacaoFormData, MovimentacoesFilters, PaginatedResponse } from '../types';
import { endOfMonth, parseISO } from 'date-fns';

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
            const startStr = parseISO(`${year}-${month.padStart(2, '0')}-01T00:00:00Z`);
            const endStr = endOfMonth(startStr);
            query = query.gte('data_hora_inicial', startStr.toISOString()).lte('data_hora_inicial', endStr.toISOString());
        }

        if (searchTerm) {
            query = query.or(`responsavel.ilike.%${searchTerm}%,veiculo.marca_modelo.ilike.%${searchTerm}%,veiculo.placa.ilike.%${searchTerm}%`);
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
            p_search_term: searchTerm || null
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
                .from('con_usuarios')
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
            .insert([payload]);

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
            .update(payload)
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
