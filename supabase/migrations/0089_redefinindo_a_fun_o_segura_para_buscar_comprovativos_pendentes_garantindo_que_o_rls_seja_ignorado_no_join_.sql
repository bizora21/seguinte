CREATE OR REPLACE FUNCTION public.get_pending_proofs_with_seller_details()
RETURNS TABLE (
    id uuid,
    seller_id uuid,
    proof_file_url text,
    amount_paid numeric,
    status text,
    submission_date timestamptz,
    reviewed_date timestamptz,
    store_name text,
    email text
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = '' -- Força a execução como superusuário, ignorando RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT
        spp.id,
        spp.seller_id,
        spp.proof_file_url,
        spp.amount_paid,
        spp.status,
        spp.submission_date,
        spp.reviewed_date,
        p.store_name,
        p.email
    FROM
        public.seller_payment_proofs AS spp
    JOIN
        public.profiles AS p ON spp.seller_id = p.id
    WHERE
        spp.status = 'pending';
END;
$$;