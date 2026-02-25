-- ----------------------------------------------------
-- TABLE: frota_checklists
-- Módulo: Gestão de Frota / Checklists
-- Descrição: Registra os checklists diários ou
--            inspeções de manutenção de cada veículo.
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.frota_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    veiculo_id UUID NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
    km_atual NUMERIC NOT NULL,
    checkitens TEXT[] NOT NULL DEFAULT '{}',
    outros_itens TEXT,
    avaria_manutencao BOOLEAN NOT NULL DEFAULT false,
    descricao_avaria TEXT,
    responsavel VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.frota_checklists ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura para usuários autenticados" 
    ON public.frota_checklists FOR SELECT 
    TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" 
    ON public.frota_checklists FOR INSERT 
    TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" 
    ON public.frota_checklists FOR UPDATE 
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" 
    ON public.frota_checklists FOR DELETE 
    TO authenticated USING (true);

-- Índices de Otimização e Filtros de Pesquisa
CREATE INDEX IF NOT EXISTS idx_frota_checklists_data ON public.frota_checklists(data);
CREATE INDEX IF NOT EXISTS idx_frota_checklists_veiculo_id ON public.frota_checklists(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_frota_checklists_avaria ON public.frota_checklists(avaria_manutencao);
