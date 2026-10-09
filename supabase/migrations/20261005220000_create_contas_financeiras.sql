-- Migração para criação das tabelas de contas_financeiras e conciliação / ajustes auditáveis de saldo

CREATE TABLE IF NOT EXISTS public.contas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa TEXT NOT NULL CHECK (empresa IN ('SEMOG', 'FEMOG')),
    nome TEXT NOT NULL,
    tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca_aplicacao', 'caixa_fisico')),
    agencia TEXT,
    conta TEXT,
    chave_pix TEXT,
    saldo_inicial NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    data_saldo_inicial DATE NOT NULL DEFAULT CURRENT_DATE,
    limite_cheque_especial NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    saldo_atual NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_financeiras_empresa ON public.contas_financeiras(empresa);
CREATE INDEX IF NOT EXISTS idx_contas_financeiras_status ON public.contas_financeiras(status);
CREATE INDEX IF NOT EXISTS idx_contas_financeiras_tipo ON public.contas_financeiras(tipo_conta);

ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_select_contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "rls_select_contas_financeiras" ON public.contas_financeiras
    FOR SELECT TO authenticated USING (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_insert_contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "rls_insert_contas_financeiras" ON public.contas_financeiras
    FOR INSERT TO authenticated WITH CHECK (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_update_contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "rls_update_contas_financeiras" ON public.contas_financeiras
    FOR UPDATE TO authenticated USING (public.has_financeiro_access()) WITH CHECK (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_delete_contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "rls_delete_contas_financeiras" ON public.contas_financeiras
    FOR DELETE TO authenticated USING (public.has_financeiro_access());

-- Tabela para histórico auditável de ajustes de conciliação de saldo
CREATE TABLE IF NOT EXISTS public.contas_financeiras_ajustes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_id UUID NOT NULL REFERENCES public.contas_financeiras(id) ON DELETE CASCADE,
    saldo_anterior NUMERIC(15, 2) NOT NULL,
    saldo_novo NUMERIC(15, 2) NOT NULL,
    diferenca NUMERIC(15, 2) NOT NULL,
    tipo_ajuste TEXT NOT NULL CHECK (tipo_ajuste IN ('credito', 'debito')),
    data_ajuste DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    usuario_nome TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_financeiras_ajustes_conta_id ON public.contas_financeiras_ajustes(conta_id);

ALTER TABLE public.contas_financeiras_ajustes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_select_contas_financeiras_ajustes" ON public.contas_financeiras_ajustes;
CREATE POLICY "rls_select_contas_financeiras_ajustes" ON public.contas_financeiras_ajustes
    FOR SELECT TO authenticated USING (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_insert_contas_financeiras_ajustes" ON public.contas_financeiras_ajustes;
CREATE POLICY "rls_insert_contas_financeiras_ajustes" ON public.contas_financeiras_ajustes
    FOR INSERT TO authenticated WITH CHECK (public.has_financeiro_access());

DROP POLICY IF EXISTS "rls_delete_contas_financeiras_ajustes" ON public.contas_financeiras_ajustes;
CREATE POLICY "rls_delete_contas_financeiras_ajustes" ON public.contas_financeiras_ajustes
    FOR DELETE TO authenticated USING (public.has_financeiro_access());
