-- 1. Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- ex: 'delivery_confirmed', 'payment_proof'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_id UUID -- Can link to order_id, proof_id, etc.
);

-- 2. Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Admin (Full access)
CREATE POLICY "Admin full access to notifications" ON public.admin_notifications
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com');