-- Execute este script no Editor SQL do Supabase para corrigir as permissões

-- 1. Garante que o RLS está ativo
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Política de Leitura: Permitir que qualquer usuário logado veja a lista
-- Se preferir restringir, mude "true" para checar o cargo
DROP POLICY IF EXISTS "Permitir Leitura Usuarios" ON public.usuarios;
CREATE POLICY "Permitir Leitura Usuarios"
ON public.usuarios
FOR SELECT
TO authenticated
USING (true);

-- 3. Política de Escrita: Apenas Adm pode Inserir/Editar/Excluir
-- (Nota: A criação via Edge Function usa super-admin, mas edições diretas usam isso)
DROP POLICY IF EXISTS "Permitir Escrita Adm" ON public.usuarios;
CREATE POLICY "Permitir Escrita Adm"
ON public.usuarios
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'permissao') = 'Adm'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'permissao') = 'Adm'
);
