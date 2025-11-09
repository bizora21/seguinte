-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "admins_podem_ver_todos_os_comprovativos" ON public.seller_payment_proofs;
DROP POLICY IF EXISTS "Sellers can insert their own payment proofs" ON public.seller_payment_proofs;
DROP POLICY IF EXISTS "Sellers can view their own payment proofs" ON public.seller_payment_proofs;
DROP POLICY IF EXISTS "admins_podem_atualizar_comprovativos" ON public.seller_payment_proofs;
DROP POLICY IF EXISTS "admins_podem_deletar_comprovativos" ON public.seller_payment_proofs;

-- Create secure policies from scratch
CREATE POLICY "admins_podem_ver_todos_os_comprovativos" ON public.seller_payment_proofs
FOR SELECT TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com');

CREATE POLICY "Sellers can insert their own payment proofs" ON public.seller_payment_proofs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can view their own payment proofs" ON public.seller_payment_proofs
FOR SELECT TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "admins_podem_atualizar_comprovativos" ON public.seller_payment_proofs
FOR UPDATE TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com');

CREATE POLICY "admins_podem_deletar_comprovativos" ON public.seller_payment_proofs
FOR DELETE TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com');