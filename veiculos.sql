CREATE TABLE IF NOT EXISTS public.frota_veiculos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    marca_modelo VARCHAR NOT NULL,
    placa VARCHAR(20) NOT NULL UNIQUE,
    tipo VARCHAR NOT NULL CHECK (tipo IN ('Combustão', 'Elétrico')),
    abastecimento BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR NOT NULL CHECK (status IN ('Ativo', 'Em Manutenção', 'Inativo')) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.frota_veiculos ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de Segurança
CREATE POLICY "Enable read access for all users on frota_veiculos" ON public.frota_veiculos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only on frota_veiculos" ON public.frota_veiculos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only on frota_veiculos" ON public.frota_veiculos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only on frota_veiculos" ON public.frota_veiculos FOR DELETE USING (auth.role() = 'authenticated');
