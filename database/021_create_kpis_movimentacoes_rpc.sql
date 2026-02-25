-- Função RPC para buscar as agregações (KPIs) das Movimentações do mês
CREATE OR REPLACE FUNCTION get_movimentacoes_kpis(
    p_month integer,
    p_year integer,
    p_search_term text DEFAULT NULL
)
RETURNS TABLE (
    total_movimentacoes bigint,
    total_km_rodados numeric,
    total_consumo_kw numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(m.id) as total_movimentacoes,
        COALESCE(SUM(m.km_rodados), 0) as total_km_rodados,
        COALESCE(SUM(m.consumo_kw), 0) as total_consumo_kw
    FROM 
        frota_movimentacoes m
    LEFT JOIN 
        frota_veiculos v ON m.veiculo_id = v.id
    WHERE 
        EXTRACT(MONTH FROM m.data_hora_inicial) = p_month
        AND EXTRACT(YEAR FROM m.data_hora_inicial) = p_year
        AND (
            p_search_term IS NULL 
            OR p_search_term = ''
            OR v.marca_modelo ILIKE '%' || p_search_term || '%'
            OR v.placa ILIKE '%' || p_search_term || '%'
            OR m.responsavel ILIKE '%' || p_search_term || '%'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
