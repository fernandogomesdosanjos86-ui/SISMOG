-- Permitir que gestores de outros setores (ex: Supervisão) possam consultar contratos/postos para gestão de equipamentos controlados
DROP POLICY IF EXISTS "rls_select_financeiro" ON public.contratos;
CREATE POLICY "rls_select_financeiro" ON public.contratos
FOR SELECT TO authenticated
USING (
  has_financeiro_access() OR is_adm_or_gestao()
);
