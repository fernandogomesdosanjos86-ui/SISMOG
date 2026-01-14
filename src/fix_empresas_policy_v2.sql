-- Habilitar RLS para garantir segurança
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Remover política anterior se existir para evitar conflitos
DROP POLICY IF EXISTS "Permitir acesso total a empresas" ON empresas;
DROP POLICY IF EXISTS "Permitir leitura de empresas" ON empresas;

-- Criar política padronizada (ALL actions para usuários autenticados)
CREATE POLICY "Permitir acesso total a empresas" ON empresas
FOR ALL
USING (auth.role() = 'authenticated');
