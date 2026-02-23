-- 1. Create table
CREATE TABLE public.supervisao_apontamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa TEXT NOT NULL,
    posto_id UUID REFERENCES public.postos_trabalho(id) ON DELETE RESTRICT,
    funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    apontamento TEXT NOT NULL,
    data DATE NOT NULL,
    frequencia_pts INTEGER NOT NULL DEFAULT 0,
    beneficios_pts INTEGER NOT NULL DEFAULT 0,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.supervisao_apontamentos ENABLE ROW LEVEL SECURITY;

-- 3. Configurar Policies
CREATE POLICY "Enable read for authenticated users" ON public.supervisao_apontamentos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.supervisao_apontamentos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.supervisao_apontamentos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.supervisao_apontamentos
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Trigger for updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.supervisao_apontamentos
  FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);
