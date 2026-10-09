-- Migração para criação da tabela categorias_financeiras com RLS e carga inicial (Seed)

CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categorias_financeiras(id) ON DELETE RESTRICT,
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    nome TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices de performance e unicidade
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_parent_id ON public.categorias_financeiras(parent_id);
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_tipo ON public.categorias_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_status ON public.categorias_financeiras(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_pai_tipo_nome ON public.categorias_financeiras (tipo, LOWER(TRIM(nome))) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_subcategorias_parent_nome ON public.categorias_financeiras (parent_id, LOWER(TRIM(nome))) WHERE parent_id IS NOT NULL;

-- RLS
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_select_categorias_financeiras" ON public.categorias_financeiras;
CREATE POLICY "rls_select_categorias_financeiras" ON public.categorias_financeiras
    FOR SELECT TO authenticated USING (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_insert_categorias_financeiras" ON public.categorias_financeiras;
CREATE POLICY "rls_insert_categorias_financeiras" ON public.categorias_financeiras
    FOR INSERT TO authenticated WITH CHECK (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_update_categorias_financeiras" ON public.categorias_financeiras;
CREATE POLICY "rls_update_categorias_financeiras" ON public.categorias_financeiras
    FOR UPDATE TO authenticated USING (public.has_financeiro_access()) WITH CHECK (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_delete_categorias_financeiras" ON public.categorias_financeiras;
CREATE POLICY "rls_delete_categorias_financeiras" ON public.categorias_financeiras
    FOR DELETE TO authenticated USING (public.has_financeiro_access());

-- Seed de Categorias e Subcategorias
DO $$
DECLARE
    v_parent_id UUID;
BEGIN
    -- RECEITAS
    -- 1. Prestação de Serviços
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('receita', 'Prestação de Serviços', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'receita' AND nome = 'Prestação de Serviços' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('receita', 'Postos Fixos', v_parent_id, 'ativa'),
        ('receita', 'Facilities', v_parent_id, 'ativa'),
        ('receita', 'Eventos', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- 2. Serviços Avulsos
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('receita', 'Serviços Avulsos', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'receita' AND nome = 'Serviços Avulsos' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('receita', 'Eventos', v_parent_id, 'ativa'),
        ('receita', 'Escolta e Apoio Tático', v_parent_id, 'ativa'),
        ('receita', 'Diárias Avulsas', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- 3. Outras Receitas
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('receita', 'Outras Receitas', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'receita' AND nome = 'Outras Receitas' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('receita', 'Rendimentos', v_parent_id, 'ativa'),
        ('receita', 'Venda de Ativos', v_parent_id, 'ativa'),
        ('receita', 'Ajuste de Saldo / Conciliação', v_parent_id, 'ativa'),
        ('receita', 'Empréstimos', v_parent_id, 'ativa'),
        ('receita', 'Empréstimos Sócios', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- DESPESAS
    -- 1. Folha e Pessoal
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('despesa', 'Folha e Pessoal', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'despesa' AND nome = 'Folha e Pessoal' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('despesa', 'Salários', v_parent_id, 'ativa'),
        ('despesa', 'Serviços Extras', v_parent_id, 'ativa'),
        ('despesa', 'Diárias de Eventos', v_parent_id, 'ativa'),
        ('despesa', 'Aux. Alimentação', v_parent_id, 'ativa'),
        ('despesa', 'Aux. Transporte', v_parent_id, 'ativa'),
        ('despesa', 'Aux. Combustível', v_parent_id, 'ativa'),
        ('despesa', 'Incentivo', v_parent_id, 'ativa'),
        ('despesa', 'Plano de Saúde', v_parent_id, 'ativa'),
        ('despesa', 'Seguros de Vida', v_parent_id, 'ativa'),
        ('despesa', 'Medicina e Segurança do Trabalho', v_parent_id, 'ativa'),
        ('despesa', 'Sistemas de Ponto e RH', v_parent_id, 'ativa'),
        ('despesa', 'Consignados e Retenções de Funcionários', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- 2. Frota e Logística
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('despesa', 'Frota e Logística', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'despesa' AND nome = 'Frota e Logística' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('despesa', 'Combustível', v_parent_id, 'ativa'),
        ('despesa', 'Oficina e Manutenção', v_parent_id, 'ativa'),
        ('despesa', 'Higienização', v_parent_id, 'ativa'),
        ('despesa', 'Seguros de Veículos', v_parent_id, 'ativa'),
        ('despesa', 'IPVA, Licenciamento e Parcelamentos de IPVA', v_parent_id, 'ativa'),
        ('despesa', 'Financiamentos de Veículos', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- 3. Administrativo, Sede e Operação
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('despesa', 'Administrativo, Sede e Operação', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'despesa' AND nome = 'Administrativo, Sede e Operação' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('despesa', 'Aluguel e Condomínio', v_parent_id, 'ativa'),
        ('despesa', 'Energia Elétrica', v_parent_id, 'ativa'),
        ('despesa', 'Água e Esgoto', v_parent_id, 'ativa'),
        ('despesa', 'Internet e Telefonia', v_parent_id, 'ativa'),
        ('despesa', 'Limpeza e Conservação da Sede', v_parent_id, 'ativa'),
        ('despesa', 'Serviços Jurídicos e Contabilidade', v_parent_id, 'ativa'),
        ('despesa', 'Segurança da Sede / Monitoramento', v_parent_id, 'ativa'),
        ('despesa', 'Fornecedores e Parceiros Comerciais', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- 4. Tributos e Impostos
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('despesa', 'Tributos e Impostos', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'despesa' AND nome = 'Tributos e Impostos' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('despesa', 'Impostos Correntes do Mês', v_parent_id, 'ativa'),
        ('despesa', 'Parcelamentos Fiscais e Previdenciários', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- 5. Despesas Financeiras e Empréstimos
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('despesa', 'Despesas Financeiras e Empréstimos', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'despesa' AND nome = 'Despesas Financeiras e Empréstimos' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('despesa', 'Tarifas e Pacotes Bancários', v_parent_id, 'ativa'),
        ('despesa', 'Juros e Encargos Bancários', v_parent_id, 'ativa'),
        ('despesa', 'Empréstimos e Financiamentos Bancários', v_parent_id, 'ativa'),
        ('despesa', 'Ajuste de Saldo / Conciliação', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;

    -- 6. Sócios e Retiradas
    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status)
    VALUES ('despesa', 'Sócios e Retiradas', NULL, 'ativa')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_parent_id FROM public.categorias_financeiras WHERE tipo = 'despesa' AND nome = 'Sócios e Retiradas' AND parent_id IS NULL;

    INSERT INTO public.categorias_financeiras (tipo, nome, parent_id, status) VALUES
        ('despesa', 'Pró-labore e Distribuição de Lucros', v_parent_id, 'ativa'),
        ('despesa', 'Empréstimos e Mútuos com Sócios / Terceiros', v_parent_id, 'ativa'),
        ('despesa', 'Integralização e Aporte de Capital', v_parent_id, 'ativa')
    ON CONFLICT DO NOTHING;
END $$;
