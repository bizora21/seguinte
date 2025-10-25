-- 1. Remover a restrição antiga (se existir)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Adicionar a nova restrição, incluindo 'completed'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'preparing', 'in_transit', 'delivered', 'completed', 'cancelled'));