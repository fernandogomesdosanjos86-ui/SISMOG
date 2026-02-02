-- ============================================
-- SCRIPT DE CONFIGURAÇÃO DA TABELA USUARIOS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR TABELA (se não existir)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    permissao TEXT NOT NULL CHECK (permissao IN ('Adm', 'Gestor', 'Operador')),
    setor TEXT CHECK (setor IN ('Direção', 'Dep. Pessoal', 'Frota', 'Financeiro', 'Supervisão')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Permitir Leitura Usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir Escrita Adm" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios são visíveis para usuários autenticados" ON public.usuarios;

-- 4. CRIAR POLÍTICA DE LEITURA
-- Permite que QUALQUER usuário autenticado veja a lista de usuários
CREATE POLICY "Usuarios são visíveis para usuários autenticados"
ON public.usuarios
FOR SELECT
TO authenticated
USING (true);

-- 5. CRIAR POLÍTICA DE ESCRITA
-- Apenas Administradores podem criar, editar ou excluir usuários
CREATE POLICY "Apenas Adm pode gerenciar usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'permissao') = 'Adm'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'permissao') = 'Adm'
);

-- 6. INSERIR USUÁRIO ADMIN PADRÃO (se não existir)
-- IMPORTANTE: Ajuste o email e CPF conforme necessário
INSERT INTO public.usuarios (nome, cpf, email, permissao, setor, ativo)
VALUES ('Fernando Gomes dos Anjos', '73391107120', 'fernandogomes@semogservicos.com.br', 'Adm', 'Direção', true)
ON CONFLICT (email) DO NOTHING;

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON public.usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_permissao ON public.usuarios(permissao);

-- 8. VERIFICAR SE FUNCIONOU
SELECT * FROM public.usuarios;
