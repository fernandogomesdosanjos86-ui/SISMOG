-- Migration to add data_admissao and data_desligamento to public.funcionarios
ALTER TABLE public.funcionarios
ADD COLUMN data_admissao DATE,
ADD COLUMN data_desligamento DATE;
