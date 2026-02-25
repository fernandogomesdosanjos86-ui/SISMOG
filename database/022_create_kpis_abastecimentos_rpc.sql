-- Função RPC para buscar as agregações (KPIs) de Abastecimentos globais
CREATE OR REPLACE FUNCTION get_abastecimentos_kpis()
RETURNS TABLE (
    gasto_mes_atual numeric,
    gasto_mes_anterior numeric,
    gasto_ultimos_3_meses numeric
) AS $$
DECLARE
    v_current_month_start date;
    v_current_month_end date;
    v_prev_month_start date;
    v_prev_month_end date;
    v_last_3_months_start date;
BEGIN
    -- Datas tratadas focando no fuso de quem cadastra (geralmente Brasil/SP), mas date_trunc usa o banco
    -- Tratando as bordas do Date:
    v_current_month_start := date_trunc('month', current_date)::date;
    v_current_month_end := (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date;
    
    v_prev_month_start := date_trunc('month', current_date - interval '1 month')::date;
    v_prev_month_end := (date_trunc('month', current_date) - interval '1 day')::date;
    
    v_last_3_months_start := date_trunc('month', current_date - interval '2 months')::date;

    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN data >= v_current_month_start AND data <= v_current_month_end THEN valor ELSE 0 END), 0) as gasto_mes_atual,
        COALESCE(SUM(CASE WHEN data >= v_prev_month_start AND data <= v_prev_month_end THEN valor ELSE 0 END), 0) as gasto_mes_anterior,
        COALESCE(SUM(CASE WHEN data >= v_last_3_months_start THEN valor ELSE 0 END), 0) as gasto_ultimos_3_meses
    FROM 
        frota_abastecimentos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
