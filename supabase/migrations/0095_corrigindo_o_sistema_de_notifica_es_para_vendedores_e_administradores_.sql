-- PASSO 1: Corrigir notificações em tempo real para VENDEDORES
-- Habilitar a replicação completa na tabela de itens de pedido.
-- Isto é essencial para que o Supabase Realtime possa notificar os vendedores
-- sobre novos itens que correspondem ao seu ID de vendedor.
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

-- PASSO 2: Garantir que as notificações para o ADMINISTRADOR estão ativas
-- Recriar as funções e gatilhos de notificação para garantir que estão
-- corretamente configurados e ativos no banco de dados.

-- Função para notificar sobre NOVOS pedidos
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    client_email TEXT;
BEGIN
    -- Buscar o email do cliente para a notificação
    SELECT email INTO client_email FROM public.profiles WHERE id = NEW.user_id;

    -- Inserir notificação para o administrador
    INSERT INTO public.admin_notifications (message, type, related_id)
    VALUES (
        'Novo pedido recebido do cliente ' || COALESCE(client_email, 'Desconhecido') || '. Pedido #' || SUBSTRING(NEW.id::text, 1, 8) || '.',
        'new_order',
        NEW.id
    );
    
    RETURN NEW;
END;
$$;

-- Função para notificar sobre CANCELAMENTO de pedidos
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

-- Ativar o gatilho para NOVOS pedidos
DROP TRIGGER IF EXISTS on_new_order ON public.orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_order();

-- Ativar o gatilho para CANCELAMENTO de pedidos
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;
CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_order_cancellation();