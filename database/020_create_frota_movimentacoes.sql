-- ----------------------------------------------------
-- TABLE: frota_movimentacoes
-- Módulo: Gestão de Frota / Movimentações
-- Descrição: Registra os trajetos, quilometragem e 
--            consumo energético dos veículos.
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.frota_movimentacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_hora_inicial TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_final TIMESTAMP WITH TIME ZONE NOT NULL,
    veiculo_id UUID NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
    trajeto TEXT NOT NULL,
    km_inicial NUMERIC NOT NULL,
    km_final NUMERIC NOT NULL,
    km_rodados NUMERIC NOT NULL,
    bateria_inicial NUMERIC,
    bateria_final NUMERIC,
    consumo_bateria NUMERIC,
    consumo_kw NUMERIC,
    responsavel VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.frota_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura para usuários autenticados" 
    ON public.frota_movimentacoes FOR SELECT 
    TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" 
    ON public.frota_movimentacoes FOR INSERT 
    TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" 
    ON public.frota_movimentacoes FOR UPDATE 
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" 
    ON public.frota_movimentacoes FOR DELETE 
    TO authenticated USING (true);

-- Índices de Otimização e Filtros de Pesquisa
CREATE INDEX IF NOT EXISTS idx_frota_mov_data_inicial ON public.frota_movimentacoes(data_hora_inicial);
CREATE INDEX IF NOT EXISTS idx_frota_mov_veiculo_id ON public.frota_movimentacoes(veiculo_id);
