-- 1. Arrumar tabela Contas Corrente
ALTER TABLE financeiro_contas_corrente 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Se você já inseriu dados, você pode querer migrar (opcional, pode ignorar se estiver vazio)
-- UPDATE financeiro_contas_corrente SET empresa_id = (SELECT id FROM empresas WHERE empresas.nome = financeiro_contas_corrente.empresa LIMIT 1);

-- Remover a coluna antiga de texto se desejar, ou apenas deixar de usar
-- ALTER TABLE financeiro_contas_corrente DROP COLUMN empresa;


-- 2. Arrumar tabela Cartões de Crédito
ALTER TABLE financeiro_cartoes_credito
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- 3. Habilitar RLS (Segurança) se ainda não estiver
ALTER TABLE financeiro_contas_corrente ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_cartoes_credito ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso (Permitir tudo para usuários autenticados por enquanto)
CREATE POLICY "Permitir acesso total a contas" ON financeiro_contas_corrente
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir acesso total a cartoes" ON financeiro_cartoes_credito
FOR ALL USING (auth.role() = 'authenticated');
