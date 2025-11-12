CREATE OR REPLACE FUNCTION public.handle_abandoned_carts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  automation_enabled BOOLEAN;
  abandoned_order RECORD;
  customer_email TEXT;
  product_names TEXT;
BEGIN
  -- Verificar se a automação está ativa
  SELECT is_enabled INTO automation_enabled
  FROM public.email_automations
  WHERE id = 'abandoned-cart';

  -- Se não estiver ativa, sair da função
  IF NOT automation_enabled THEN
    RETURN;
  END IF;

  -- Iterar sobre pedidos pendentes há mais de 24h e menos de 48h, que ainda não receberam lembrete
  FOR abandoned_order IN
    SELECT id, user_id
    FROM public.orders
    WHERE status = 'pending'
      AND updated_at < (NOW() - INTERVAL '24 hours')
      AND updated_at > (NOW() - INTERVAL '48 hours')
      AND abandoned_cart_sent_at IS NULL
  LOOP
    -- Obter o e-mail do cliente
    SELECT email INTO customer_email FROM public.profiles WHERE id = abandoned_order.user_id;

    -- Obter os nomes dos produtos no carrinho
    SELECT string_agg(p.name, ', ')
    INTO product_names
    FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    WHERE oi.order_id = abandoned_order.id;

    -- Se encontrarmos um e-mail, enviar o lembrete
    IF customer_email IS NOT NULL THEN
      PERFORM net.http_post(
        url:='https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/email-sender',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '"}'::jsonb,
        body:=jsonb_build_object(
          'to', customer_email,
          'subject', 'Você esqueceu algo no seu carrinho! 👀',
          'html', '<h1>Quase lá!</h1><p>Parece que você deixou alguns itens no seu carrinho: <strong>' || COALESCE(product_names, 'seus produtos') || '</strong>.</p><p>Não perca a oportunidade, finalize sua compra agora e aproveite o frete grátis para todo Moçambique!</p><p><a href="https://lojarapidamz.com/carrinho">Finalizar Compra</a></p>'
        )
      );

      -- Marcar o pedido como notificado para não enviar novamente
      UPDATE public.orders
      SET abandoned_cart_sent_at = NOW()
      WHERE id = abandoned_order.id;
    END IF;
  END LOOP;
END;
$$;