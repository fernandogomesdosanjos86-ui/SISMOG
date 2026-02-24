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

export interface Abastecimento {
    id: string;
    data: string;
    veiculo_id: string;
    km_atual: number;
    litros: number;
    valor: number;
    responsavel: string;
    created_at: string;

    // Joined vehicle data
    frota_veiculos?: {
        marca_modelo: string;
        placa: string;
    };
}

export interface AbastecimentoFormData {
    data: string;
    veiculo_id: string;
    km_atual: number | '';
    litros: number | '';
    valor: number | '';
}
