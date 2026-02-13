export type TipoProduto = 'Individual' | 'Coletivo';
export type TipoMovimentacao = 'Compra' | 'Entrega' | 'Devolução' | 'Descarte';

export interface Produto {
    id: string;
    tipo: TipoProduto;
    cor?: string;
    tamanho?: string;
    produto: string;
    codigo: string;
    created_at: string;
}

export type ProdutoFormData = Omit<Produto, 'id' | 'codigo' | 'created_at'>;

export interface Movimentacao {
    id: string;
    tipo: TipoMovimentacao;
    produto_id: string;
    quantidade: number;
    data: string;
    funcionario_id: string | null;
    posto_id: string | null;
    observacao: string | null;
    created_at: string;
    // Joins
    produto?: { id: string; codigo: string; tipo: TipoProduto };
    funcionario?: { id: string; nome: string; empresa: string };
    posto?: { id: string; nome: string; empresa: string };
}

export type MovimentacaoFormData = Omit<Movimentacao, 'id' | 'created_at' | 'produto' | 'funcionario' | 'posto'>;

export interface ResumoFuncionario {
    id: string;
    nome: string;
    empresa: string;
    qtd: number;
}

export interface ResumoPosto {
    id: string;
    nome: string;
    empresa: string;
    qtd: number;
}
