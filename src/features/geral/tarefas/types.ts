export type PrioridadeTarefa = 'Normal' | 'Urgente';
export type StatusTarefaMissao = 'Pendente' | 'Em Andamento' | 'Concluído';

export interface UsuarioSimples {
    id: string;
    nome: string;
}

export interface TarefaDestinatario {
    id: string;
    tarefa_id: string;
    usuario_id: string;
    usuario?: UsuarioSimples; // Joined data
}

export interface Missao {
    id: string;
    tarefa_id: string;
    missao: string;
    observacoes?: string | null;
    status_missao: StatusTarefaMissao;
    created_at: string;
    updated_at: string;
}

export interface TarefaChat {
    id: string;
    tarefa_id: string;
    usuario_id: string;
    usuario?: UsuarioSimples; // Joined data
    data_hora: string;
    chat: string;
    arquivo_url?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Tarefa {
    id: string;
    data_solicitacao: string;
    data_limite: string;
    titulo: string;
    prioridade: PrioridadeTarefa;
    remetente_id: string;
    remetente?: UsuarioSimples; // Joined data
    status_tarefa: StatusTarefaMissao;
    created_at: string;
    updated_at: string;

    // Relational data usually fetched together
    destinatarios?: TarefaDestinatario[];
    missoes?: Missao[];
    chats?: TarefaChat[];
}

export interface TarefaFormData {
    titulo: string;
    data_solicitacao: string;
    data_limite: string;
    prioridade: PrioridadeTarefa;
    destinatarios: string[]; // Array of user IDs
    missoes: { missao: string; observacoes?: string }[];
}

export interface MissaoFormData {
    missao: string;
    observacoes?: string;
}

export interface ChatFormData {
    chat: string;
    arquivo?: File | null;
}
