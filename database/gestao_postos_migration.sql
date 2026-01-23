-- Gestão de Postos - Migration
-- Aplicar no Supabase SQL Editor

-- Tabela: gestao_postos (postos vinculados à gestão)
CREATE TABLE gestao_postos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Tabela: gestao_postos_funcionarios (funcionários lotados)
CREATE TABLE gestao_postos_funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gestao_posto_id UUID NOT NULL REFERENCES gestao_postos(id) ON DELETE CASCADE,
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id),
    tipo_lotacao VARCHAR(20) NOT NULL CHECK (tipo_lotacao IN ('Oficial', 'Temporaria', 'ServicoExtra')),
    escala VARCHAR(20) NOT NULL CHECK (escala IN ('12x36', '5x1', '6x2', 'Outra')),
    turno VARCHAR(20) NOT NULL CHECK (turno IN ('Diurno', 'Noturno')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Unique constraint: Oficial/Temporária não duplica funcionário no posto
CREATE UNIQUE INDEX idx_gestao_func_unico 
ON gestao_postos_funcionarios (gestao_posto_id, funcionario_id) 
WHERE tipo_lotacao IN ('Oficial', 'Temporaria') AND deleted_at IS NULL;

-- Index para performance
CREATE INDEX idx_gestao_postos_contrato ON gestao_postos(contrato_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gestao_funcionarios_posto ON gestao_postos_funcionarios(gestao_posto_id) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE gestao_postos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestao_postos_funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON gestao_postos FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON gestao_postos_funcionarios FOR ALL USING (true);
