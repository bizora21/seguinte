CREATE TABLE public.financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    commission_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'commission_deducted' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Apenas o administrador pode ver todas as transações
CREATE POLICY "Admin can view all financial transactions" ON public.financial_transactions
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.email = 'lojarapidamz@outlook.com'));

-- Políticas de RLS: Vendedor pode ver suas próprias transações
CREATE POLICY "Seller can view own financial transactions" ON public.financial_transactions
FOR SELECT TO authenticated USING (auth.uid() = seller_id);