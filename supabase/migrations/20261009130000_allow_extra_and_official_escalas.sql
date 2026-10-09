-- Permitir que um funcionário possa estar na escala como Oficial e Extra, inclusive em turnos distintos (ex: Diurno e Noturno)
ALTER TABLE IF EXISTS public.supervisao_escalas
  DROP CONSTRAINT IF EXISTS supervisao_escalas_competencia_funcionario_id_posto_id_key;

ALTER TABLE IF EXISTS public.supervisao_escalas
  DROP CONSTRAINT IF EXISTS supervisao_escalas_competencia_func_posto_tipo_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supervisao_escalas_comp_func_posto_tipo_turno_key'
  ) THEN
    ALTER TABLE public.supervisao_escalas
      ADD CONSTRAINT supervisao_escalas_comp_func_posto_tipo_turno_key
      UNIQUE (competencia, funcionario_id, posto_id, tipo, turno);
  END IF;
END $$;
