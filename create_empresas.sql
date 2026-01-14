-- Create table 'empresas'
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    regime_tributario TEXT CHECK (regime_tributario IN ('Lucro Real', 'Lucro Presumido', 'Simples Nacional')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS for smooth development usage
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- Insert sample data for verification
INSERT INTO empresas (nome, regime_tributario, ativo) VALUES
('Empresa Modelo S.A.', 'Lucro Real', true),
('Tecnologia e Inovação Ltda', 'Lucro Presumido', true),
('Padaria do Bairro', 'Simples Nacional', true);
