-- 1. Adicionar colunas em funcionarios
ALTER TABLE public.funcionarios
ADD COLUMN IF NOT EXISTS valor_transporte_dia numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_combustivel_dia numeric(10,2) DEFAULT 0;

-- 2. Criar tabela rh_beneficios_calculados
CREATE TABLE IF NOT EXISTS public.rh_beneficios_calculados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    competencia text NOT NULL,
    empresa text NOT NULL,
    posto_id uuid REFERENCES public.postos_trabalho(id) ON DELETE SET NULL,
    funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    cargo_id uuid REFERENCES public.cargos_salarios(id) ON DELETE SET NULL,
    dias_trabalhar numeric(5,2) DEFAULT 0,
    dias_ausente numeric(5,2) DEFAULT 0,
    total_dias numeric(5,2) GENERATED ALWAYS AS (dias_trabalhar - dias_ausente) STORED,
    valor_alimentacao_dia numeric(10,2) DEFAULT 0,
    valor_transporte_dia numeric(10,2) DEFAULT 0,
    valor_combustivel_dia numeric(10,2) DEFAULT 0,
    valor_incentivo_mensal numeric(10,2) DEFAULT 0,
    total_alimentacao numeric(10,2) DEFAULT 0,
    total_transporte numeric(10,2) DEFAULT 0,
    total_combustivel numeric(10,2) DEFAULT 0,
    total_geral numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint para evitar duplicação na mesma competência para o mesmo funcionário e empresa
    UNIQUE(competencia, funcionario_id, empresa)
);

-- Habilitar RLS
ALTER TABLE public.rh_beneficios_calculados ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Enable all operations for true" ON public.rh_beneficios_calculados
    FOR ALL USING (true) WITH CHECK (true);
