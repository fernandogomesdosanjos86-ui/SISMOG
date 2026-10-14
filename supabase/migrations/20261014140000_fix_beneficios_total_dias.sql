-- Fix: Permitir que total_dias considere acréscimos de dias (Troca Presença) e deduções (Faltas/Ausências)
-- Anteriormente usava ABS(dias_ausente), o que fazia acréscimos de dias (Troca Presença) deduzirem dias em vez de somar.

ALTER TABLE public.rh_beneficios_calculados
DROP COLUMN total_dias;

ALTER TABLE public.rh_beneficios_calculados
ADD COLUMN total_dias numeric(5,2) GENERATED ALWAYS AS (GREATEST(0, dias_trabalhar - dias_ausente)) STORED;
