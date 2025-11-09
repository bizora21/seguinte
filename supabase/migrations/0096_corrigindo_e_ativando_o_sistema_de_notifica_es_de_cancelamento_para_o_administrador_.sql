-- Recriar a função de notificação de cancelamento para garantir que está correta
CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    client_email TEXT;
BEGIN
    -- Verifica se o status mudou para 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
        
        -- Buscar o email do cliente para a notificação
        SELECT email INTO client_email FROM public.profiles WHERE id = NEW.user_id;
        
        -- Inserir notificação para o administrador
        INSERT INTO public.admin_notifications (message, type, related_id)
        VALUES (
            'O cliente ' || COALESCE(client_email, 'Desconhecido') || ' cancelou o Pedido #' || SUBSTRING(NEW.id::text, 1, 8) || '.',
            'order_cancelled',
            NEW.id
        );
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Garantir que o gatilho de CANCELAMENTO está ativo e corretamente configurado
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;
CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_order_cancellation();