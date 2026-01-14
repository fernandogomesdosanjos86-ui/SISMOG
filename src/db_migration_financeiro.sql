CREATE TABLE IF NOT EXISTS financeiro_contas_corrente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa TEXT NOT NULL,
  banco TEXT NOT NULL,
  numero_banco TEXT,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financeiro_cartoes_credito (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa TEXT NOT NULL,
  banco TEXT NOT NULL,
  bandeira TEXT NOT NULL,
  numero_cartao TEXT NOT NULL,
  usuario TEXT NOT NULL,
  limite DECIMAL(12,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
