-- 1. Remover a política de inserção antiga e defeituosa.
DROP POLICY IF EXISTS "Sellers can insert their own payment proofs" ON public.seller_payment_proofs;

-- 2. Criar uma nova política de inserção explícita e segura.
-- Isto garante que um vendedor autenticado SÓ PODE inserir um comprovativo para si mesmo.
CREATE POLICY "Sellers can insert their own payment proofs"
ON public.seller_payment_proofs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);