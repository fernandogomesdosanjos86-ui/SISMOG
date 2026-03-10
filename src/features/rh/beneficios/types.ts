export interface BeneficioCalculado {
    id: string;
    competencia: string;
    empresa: 'FEMOG' | 'SEMOG';
    posto_id?: string;
    funcionario_id: string;
    cargo_id?: string;
    dias_trabalhar: number;
    dias_ausente: number;
    total_dias: number;
    valor_alimentacao_dia: number;
    valor_transporte_dia: number;
    valor_combustivel_dia: number;
    valor_incentivo_mensal: number;
    total_alimentacao: number;
    total_transporte: number;
    total_combustivel: number;
    total_geral: number;
    created_at: string;

    // Relacionamentos expandidos do Supabase
    funcionarios?: {
        nome: string;
        cpf: string;
    };
    postos_trabalho?: {
        nome: string;
    };
    cargos_salarios?: {
        cargo: string;
    };
}
