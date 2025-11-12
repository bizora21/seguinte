-- Adiciona uma coluna para rastrear o envio de e-mails de carrinho abandonado
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS abandoned_cart_sent_at TIMESTAMP WITH TIME ZONE;