import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export interface User {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    permissao: 'Adm' | 'Gestor' | 'Operador';
    setor?: 'Direção' | 'Dep. Pessoal' | 'Frota' | 'Financeiro' | 'Supervisão' | null;
    ativo: boolean;
}

export const useUsers = () => {
    const queryClient = useQueryClient();

    // Fetch Users
    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .order('nome');

            if (error) throw error;
            return data as User[];
        },
    });

    // Create User (via Edge Function)
    const createUser = useMutation({
        mutationFn: async (newUser: Partial<User>) => {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No active session');
            }

            const response = await supabase.functions.invoke('admin-create-user', {
                body: newUser,
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            console.log('Edge Function Response:', response);

            // Check for FunctionsError (network/invoke error)
            if (response.error) {
                console.error('Functions Error:', response.error);
                // Try to get debug info from response data
                if (response.data?.debug) {
                    console.error('Debug Info:', response.data.debug);
                }
                throw new Error(response.error.message || 'Edge Function failed');
            }

            // Check for application error in response data
            if (response.data?.error) {
                console.error('Application Error:', response.data.error);
                console.error('Debug Info:', response.data.debug);
                const debugStep = response.data.debug?.step || 'unknown';
                const errorMsg = `${response.data.error} (step: ${debugStep})`;
                throw new Error(errorMsg);
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            alert('Usuário criado com sucesso!');
        },
        onError: (error) => {
            console.error('Error creating user:', error);
            alert(`Erro ao criar usuário: ${error.message}`);
        }
    });

    // Update User (via Edge Function)
    const updateUser = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const response = await supabase.functions.invoke('admin-update-user', {
                body: { user_id: id, updates },
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.error) throw new Error(response.error.message || 'Update failed');
            if (response.data?.error) throw new Error(response.data.error);

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            console.error('Error updating user:', error);
            // Feedback handled in UI component
        }
    });

    // Delete User (via Edge Function)
    const deleteUser = useMutation({
        mutationFn: async (userId: string) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const response = await supabase.functions.invoke('admin-delete-user', {
                body: { user_id: userId },
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.error) throw new Error(response.error.message || 'Delete failed');
            if (response.data?.error) throw new Error(response.data.error);

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            console.error('Error deleting user:', error);
            // Feedback handled in UI component
        }
    });

    return { users, isLoading, error, createUser, updateUser, deleteUser };
};
