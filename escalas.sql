CREATE TABLE public.supervisao_escalas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competencia TEXT NOT NULL, -- Format: YYYY-MM
    empresa TEXT NOT NULL,
    posto_id UUID REFERENCES public.postos_trabalho(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    escala TEXT NOT NULL,
    turno TEXT NOT NULL,
    inicio_12x36 INTEGER, -- 1 ou 2
    tipo TEXT,
    dias JSONB NOT NULL DEFAULT '[]'::jsonb,
    qnt_dias INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(competencia, funcionario_id, posto_id)
);

-- Enable RLS
ALTER TABLE public.supervisao_escalas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read for authenticated users" ON public.supervisao_escalas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.supervisao_escalas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.supervisao_escalas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.supervisao_escalas
    FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
DROP TRIGGER IF EXISTS handle_updated_at ON public.supervisao_escalas;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.supervisao_escalas
  FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);
