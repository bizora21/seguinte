-- Migration to ensure the Foreign Key constraint exists on product_reviews.user_id
-- This is necessary because PostgREST (PGRST200 error) cannot find the relationship.

DO $$
BEGIN
    -- Check if the constraint already exists to prevent errors on re-run
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'product_reviews_user_id_fkey'
        AND conrelid = 'public.product_reviews'::regclass
    ) THEN
        -- Add the Foreign Key constraint
        ALTER TABLE public.product_reviews
        ADD CONSTRAINT product_reviews_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END
$$;