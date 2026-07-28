-- Migration: Fix foreign key constraints on postos_trabalho for deletion
-- Description: Allow deleting postos_trabalho without triggering foreign key violation errors on servicos_extras, supervisao_apontamentos, and estoque_movimentacoes.

ALTER TABLE public.servicos_extras
  DROP CONSTRAINT IF EXISTS servicos_extras_posto_id_fkey,
  ADD CONSTRAINT servicos_extras_posto_id_fkey
    FOREIGN KEY (posto_id)
    REFERENCES public.postos_trabalho(id)
    ON DELETE CASCADE;

ALTER TABLE public.supervisao_apontamentos
  DROP CONSTRAINT IF EXISTS supervisao_apontamentos_posto_id_fkey,
  ADD CONSTRAINT supervisao_apontamentos_posto_id_fkey
    FOREIGN KEY (posto_id)
    REFERENCES public.postos_trabalho(id)
    ON DELETE CASCADE;

ALTER TABLE public.estoque_movimentacoes
  DROP CONSTRAINT IF EXISTS estoque_movimentacoes_posto_id_fkey,
  ADD CONSTRAINT estoque_movimentacoes_posto_id_fkey
    FOREIGN KEY (posto_id)
    REFERENCES public.postos_trabalho(id)
    ON DELETE SET NULL;
