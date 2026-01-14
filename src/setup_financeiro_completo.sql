-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO MÓDULO FINANCEIRO
-- Execute este script para criar todas as tabelas e permissões necessárias

-- 1. Tabela de Contas Corrente
CREATE TABLE IF NOT EXISTS financeiro_contas_corrente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL, -- Vínculo direto com empresas
  banco TEXT NOT NULL,
  numero_banco TEXT,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Cartões de Crédito
CREATE TABLE IF NOT EXISTS financeiro_cartoes_credito (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL, -- Vínculo direto com empresas
  banco TEXT NOT NULL,
  bandeira TEXT NOT NULL,
  numero_cartao TEXT NOT NULL,
  usuario TEXT NOT NULL,
  limite DECIMAL(12,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar Segurança (RLS)
ALTER TABLE financeiro_contas_corrente ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_cartoes_credito ENABLE ROW LEVEL SECURITY;

-- 4. Definir Políticas de Acesso (Padrão SISMOG: Acesso total para autenticados)

-- Políticas para Contas Corrente
DROP POLICY IF EXISTS "Permitir acesso total a contas" ON financeiro_contas_corrente;
CREATE POLICY "Permitir acesso total a contas" ON financeiro_contas_corrente
FOR ALL
USING (auth.role() = 'authenticated');

-- Políticas para Cartões de Crédito
DROP POLICY IF EXISTS "Permitir acesso total a cartoes" ON financeiro_cartoes_credito;
CREATE POLICY "Permitir acesso total a cartoes" ON financeiro_cartoes_credito
FOR ALL
USING (auth.role() = 'authenticated');

-- 5. Garantir acesso à tabela de Empresas (para o dropdown funcionar)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso total a empresas" ON empresas;
CREATE POLICY "Permitir acesso total a empresas" ON empresas
FOR ALL
USING (auth.role() = 'authenticated');
