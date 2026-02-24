import { supabase } from '../../../services/supabase';
import type { Abastecimento, AbastecimentoFormData } from '../types';

export const abastecimentosService = {
    async getAbastecimentos(): Promise<Abastecimento[]> {
        const { data, error } = await supabase
            .from('frota_abastecimentos')
            .select(`
                *,
                frota_veiculos (
                    marca_modelo,
                    placa
                )
            `)
            .order('data', { ascending: false });

        if (error) {
            console.error('Error fetching abastecimentos:', error);
            throw new Error('Erro ao buscar abastecimentos');
        }

        // Clean up join data
        return data.map((item: any) => ({
            ...item,
            frota_veiculos: Array.isArray(item.frota_veiculos) ? item.frota_veiculos[0] : item.frota_veiculos
        })) as Abastecimento[];
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
            .insert([payload])
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
            .update(abastecimento)
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
