import { normalizeSearchString } from '../../../utils/normalization';
import { supabase } from '../../../services/supabase';
import type { Abastecimento, AbastecimentoFormData, AbastecimentosFilters, PaginatedResponse } from '../types';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export const abastecimentosService = {
    getAbastecimentos: async (filters: AbastecimentosFilters): Promise<PaginatedResponse<Abastecimento>> => {
        const { page = 1, pageSize = 15, searchTerm, monthFilter } = filters;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('frota_abastecimentos')
            .select(`
                *,
                frota_veiculos!inner (
                    marca_modelo,
                    placa,
                    tipo,
                    abastecimento
                )
            `, { count: 'exact' })
            .order('data', { ascending: false });

        if (monthFilter && monthFilter !== 'TODOS') {
            const [year, month] = monthFilter.split('-');
            const dateStr = `${year}-${month.padStart(2, '0')}-01T00:00:00Z`;
            const dateObj = parseISO(dateStr);
            const startStr = startOfMonth(dateObj).toISOString();
            const endStr = endOfMonth(dateObj).toISOString();
            query = query.gte('data', startStr).lte('data', endStr);
        }

        // Se houver termo de busca, buscamos uma quantidade maior para filtrar no cliente
        if (searchTerm) {
            const { data, error } = await query; // Buscar todos (limite padrão ~1000)

            if (error) {
                console.error('Error fetching abastecimentos for search:', error);
                throw new Error('Erro ao buscar abastecimentos');
            }

            const searchNormalized = normalizeSearchString(searchTerm);

            const filteredData = (data as any[]).filter(item => {
                const responsavelMatch = normalizeSearchString(item.responsavel).includes(searchNormalized);
                const veiculoMatch = normalizeSearchString(item.frota_veiculos?.marca_modelo).includes(searchNormalized);
                const placaMatch = normalizeSearchString(item.frota_veiculos?.placa).includes(searchNormalized);

                return responsavelMatch || veiculoMatch || placaMatch;
            }).map(item => ({
                ...item,
                frota_veiculos: Array.isArray(item.frota_veiculos) ? item.frota_veiculos[0] : item.frota_veiculos
            })) as Abastecimento[];

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

        if (error) {
            console.error('Error fetching abastecimentos:', error);
            throw new Error('Erro ao buscar abastecimentos');
        }

        // Clean up join data
        const formattedData = data.map((item: any) => ({
            ...item,
            frota_veiculos: Array.isArray(item.frota_veiculos) ? item.frota_veiculos[0] : item.frota_veiculos
        })) as Abastecimento[];

        return {
            data: formattedData,
            count: count || 0,
            page,
            totalPages: count ? Math.ceil(count / pageSize) : 0
        };
    },

    getAbastecimentosKpis: async () => {
        const { data, error } = await supabase.rpc('get_abastecimentos_kpis');

        if (error) {
            console.error('Error fetching abastecimentos KPIs:', error);
            throw new Error('Erro ao buscar KPIs de abastecimentos');
        }

        return data?.[0] || {
            gasto_mes_atual: 0,
            gasto_mes_anterior: 0,
            gasto_ultimos_3_meses: 0
        };
    },

    async createAbastecimento(abastecimento: AbastecimentoFormData): Promise<Abastecimento> {
        // Obter nome do usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        let responsavelName = user?.email || 'Usuário Desconhecido';

        // Tentativa de obter o nome a partir do public.usuarios
        if (user) {
            const { data: userData } = await supabase
                .from('usuarios')
                .select('nome')
                .eq('id', user.id)
                .single();

            if (userData?.nome) {
                // Return only first and last name
                const partes = userData.nome.split(' ');
                responsavelName = partes.length > 1
                    ? `${partes[0]} ${partes[partes.length - 1]}`
                    : partes[0];
            }
        }

        const payload = {
            ...abastecimento,
            responsavel: responsavelName,
        };

        const { data, error } = await supabase
            .from('frota_abastecimentos')
            .insert([payload] as any)
            .select()
            .single();

        if (error) {
            console.error('Error creating abastecimento:', error);
            throw new Error('Erro ao criar abastecimento');
        }
        return data as Abastecimento;
    },

    async updateAbastecimento(id: string, abastecimento: Partial<AbastecimentoFormData>): Promise<Abastecimento> {
        const { data, error } = await supabase
            .from('frota_abastecimentos')
            .update(abastecimento as any)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating abastecimento:', error);
            throw new Error('Erro ao atualizar abastecimento');
        }
        return data as Abastecimento;
    },

    async deleteAbastecimento(id: string): Promise<void> {
        const { error } = await supabase
            .from('frota_abastecimentos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting abastecimento:', error);
            throw new Error('Erro ao excluir abastecimento');
        }
    }
};
