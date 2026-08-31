-- Migration: Aumentar precisão decimal dos valores de hora extra
-- De numeric(10,2) para numeric(10,4) nos campos de valor HE

-- 1. Tabela cargos_salarios: valores base da hora extra
ALTER TABLE public.cargos_salarios
  ALTER COLUMN valor_he_diurno TYPE numeric(10, 4),
  ALTER COLUMN valor_he_noturno TYPE numeric(10, 4);

-- 2. Tabela servicos_extras: valor_hora armazenado com precisão
--    (valor final continua numeric(10,2) pois já é arredondado)
ALTER TABLE public.servicos_extras
  ALTER COLUMN valor_hora TYPE numeric(10, 4);
