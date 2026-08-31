-- Migration to create parametros_folha table and setup policies
CREATE TABLE public.parametros_folha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INT UNIQUE NOT NULL,
    valor_salario_minimo NUMERIC(12, 2) NOT NULL,
    teto_salario_familia NUMERIC(12, 2) NOT NULL,
    valor_salario_familia NUMERIC(12, 2) NOT NULL,
    
    teto_inss_1 NUMERIC(12, 2) NOT NULL,
    aliquota_inss_1 NUMERIC(5, 2) NOT NULL,
    desconto_inss_1 NUMERIC(12, 2) NOT NULL,
    
    teto_inss_2 NUMERIC(12, 2) NOT NULL,
    aliquota_inss_2 NUMERIC(5, 2) NOT NULL,
    desconto_inss_2 NUMERIC(12, 2) NOT NULL,
    
    teto_inss_3 NUMERIC(12, 2) NOT NULL,
    aliquota_inss_3 NUMERIC(5, 2) NOT NULL,
    desconto_inss_3 NUMERIC(12, 2) NOT NULL,
    
    teto_inss_4 NUMERIC(12, 2) NOT NULL,
    aliquota_inss_4 NUMERIC(5, 2) NOT NULL,
    desconto_inss_4 NUMERIC(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.parametros_folha ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "rls_select_all_authenticated" ON public.parametros_folha FOR SELECT TO authenticated USING (true);
CREATE POLICY "rls_insert_adm_gestao" ON public.parametros_folha FOR INSERT TO authenticated WITH CHECK (public.is_adm_or_gestao());
CREATE POLICY "rls_update_adm_gestao" ON public.parametros_folha FOR UPDATE TO authenticated USING (public.is_adm_or_gestao()) WITH CHECK (public.is_adm_or_gestao());
CREATE POLICY "rls_delete_adm_gestao" ON public.parametros_folha FOR DELETE TO authenticated USING (public.is_adm_or_gestao());
