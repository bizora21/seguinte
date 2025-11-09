CREATE OR REPLACE FUNCTION public.get_cancelled_orders_with_customer_email()
RETURNS TABLE(
    id uuid,
    total_amount numeric,
    updated_at timestamp with time zone,
    customer_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Segurança: Apenas o administrador pode executar esta função.
    IF (SELECT auth.email()) <> 'lojarapidamz@outlook.com' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar esta função.';
    END IF;

    RETURN QUERY
    SELECT
        o.id,
        o.total_amount,
        o.updated_at,
        p.email AS customer_email
    FROM
        public.orders AS o
    LEFT JOIN
        public.profiles AS p ON o.user_id = p.id
    WHERE
        o.status = 'cancelled'
    ORDER BY
        o.updated_at DESC
    LIMIT 10;
END;
$$;