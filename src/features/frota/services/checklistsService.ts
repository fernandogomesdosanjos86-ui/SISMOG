import { supabase } from '../../../services/supabase';
import type { Checklist, ChecklistFormData, ChecklistsFilters, PaginatedResponse } from '../types';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export const checklistsService = {
    async getChecklists(filters: ChecklistsFilters): Promise<PaginatedResponse<Checklist>> {
        const { page = 1, pageSize = 15, searchTerm, monthFilter, avariasOnly } = filters;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('frota_checklists')
            .select(`
                *,
                frota_veiculos!inner (
                    marca_modelo,
                    placa
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

        if (avariasOnly) {
            query = query.eq('avaria_manutencao', true);
        }

        if (searchTerm) {
            query = query.or(`responsavel.ilike.%${searchTerm}%,frota_veiculos.marca_modelo.ilike.%${searchTerm}%,frota_veiculos.placa.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
            console.error('Error fetching checklists:', error);
            throw new Error('Erro ao buscar checklists');
        }

        // Clean up join data
        const formattedData = data.map((item: any) => ({
            ...item,
            frota_veiculos: Array.isArray(item.frota_veiculos) ? item.frota_veiculos[0] : item.frota_veiculos
        })) as Checklist[];

        return {
            data: formattedData,
            count: count || 0,
            page,
            totalPages: count ? Math.ceil(count / pageSize) : 0
        };
    },

    async createChecklist(checklist: ChecklistFormData): Promise<Checklist> {
        // Obter nome do usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        let responsavelName = "Usuário Desconhecido";

        if (user) {
            const { data: profileData } = await supabase
                .from('con_usuarios')
                .select('nome')
                .eq('id', user.id)
                .single();

            if (profileData?.nome) {
                responsavelName = profileData.nome;
            } else if (user.user_metadata?.nome) {
                responsavelName = user.user_metadata.nome;
            } else if (user.email) {
                responsavelName = user.email.split('@')[0];
            }
        }

        // Prepare payload correctly to handle empty optional fields
        const payload = {
            ...checklist,
            outros_itens: checklist.outros_itens.trim() || null,
            descricao_avaria: checklist.avaria_manutencao ? (checklist.descricao_avaria.trim() || null) : null,
            responsavel: responsavelName,
        };

        const { data, error } = await supabase
            .from('frota_checklists')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Error creating checklist:', error);
            throw new Error('Erro ao criar checklist: ' + error.message);
        }
        return data as Checklist;
    },

    async updateChecklist(id: string, checklist: Partial<ChecklistFormData>): Promise<Checklist> {

        let payload = { ...checklist };

        // Ensure dependent fields are cleared
        if (payload.avaria_manutencao === false) {
            payload.descricao_avaria = '';
        }

        if (payload.outros_itens !== undefined) {
            payload.outros_itens = payload.outros_itens.trim() || null as any;
        }

        if (payload.descricao_avaria !== undefined && payload.avaria_manutencao) {
            payload.descricao_avaria = payload.descricao_avaria.trim() || null as any;
        }

        const { data, error } = await supabase
            .from('frota_checklists')
            .update({ ...payload } as any)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating checklist:', error);
            throw new Error('Erro ao atualizar checklist');
        }
        return data as Checklist;
    },

    async deleteChecklist(id: string): Promise<void> {
        const { error } = await supabase
            .from('frota_checklists')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting checklist:', error);
            throw new Error('Erro ao excluir checklist');
        }
    }
};
