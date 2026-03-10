-- Fix: Atualizar o cálculo de total_dias para desconsiderar o sinal negativo e evitar dias negativos

ALTER TABLE public.rh_beneficios_calculados
DROP COLUMN total_dias;

ALTER TABLE public.rh_beneficios_calculados
ADD COLUMN total_dias numeric(5,2) GENERATED ALWAYS AS (GREATEST(0, dias_trabalhar - ABS(dias_ausente))) STORED;
