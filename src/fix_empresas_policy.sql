-- Habilitar RLS para Empresas (garantia)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados visualizem as empresas
-- Isso é necessário para preencher os dropdowns (selects)
DROP POLICY IF EXISTS "Permitir leitura de empresas" ON empresas;
CREATE POLICY "Permitir leitura de empresas" ON empresas
FOR SELECT
TO authenticated
USING (true);

-- Opcional: Se você usa o campo empresa_id nas tabelas financeiras, verifique se elas existem
-- (O script anterior já cuidou da criação das colunas, mas o RLS na tabela de origem 'empresas' é crucial)
