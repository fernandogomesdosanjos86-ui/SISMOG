export interface Veiculo {
    id: string;
    marca_modelo: string;
    placa: string;
    tipo: 'Combustão' | 'Elétrico';
    abastecimento: boolean;
    capacidade_bateria?: number;
    status: 'Ativo' | 'Em Manutenção' | 'Inativo';
    created_at: string;
}

export interface VeiculoFormData {
    marca_modelo: string;
    placa: string;
    tipo: 'Combustão' | 'Elétrico';
    abastecimento: boolean;
    capacidade_bateria?: number;
    status: 'Ativo' | 'Em Manutenção' | 'Inativo';
}
