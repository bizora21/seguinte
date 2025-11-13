CREATE OR REPLACE FUNCTION public.get_pending_proofs_with_seller_details()
 RETURNS TABLE(id uuid, seller_id uuid, proof_file_url text, amount_paid numeric, status text, submission_date timestamp with time zone, reviewed_date timestamp with time zone, store_name text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Security Check: Only allow the admin to execute this function.
    IF (SELECT auth.email()) <> 'lojarapidamz@outlook.com' THEN
        RAISE EXCEPTION 'Access denied. Only administrators can perform this action.';
    END IF;

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
$function$