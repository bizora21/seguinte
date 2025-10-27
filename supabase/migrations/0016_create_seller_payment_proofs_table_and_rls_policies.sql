-- 1. Create seller_payment_proofs table
CREATE TABLE public.seller_payment_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_file_url TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_date TIMESTAMP WITH TIME ZONE
);

-- 2. Enable RLS
ALTER TABLE public.seller_payment_proofs ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Sellers (Insert and Select own)
CREATE POLICY "Sellers can insert their own payment proofs" ON public.seller_payment_proofs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can view their own payment proofs" ON public.seller_payment_proofs
FOR SELECT TO authenticated USING (auth.uid() = seller_id);

-- 4. Policies for Admin (Full access)
CREATE POLICY "Admin full access to payment proofs" ON public.seller_payment_proofs
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com');