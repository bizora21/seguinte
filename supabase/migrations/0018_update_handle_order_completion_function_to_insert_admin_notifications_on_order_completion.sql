CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    item RECORD;
    commission_rate NUMERIC := 0.08; -- 8% de comissão
    commission_amount NUMERIC;
    client_email TEXT;
BEGIN
    -- Verifica se o status mudou para 'completed'
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        
        -- 0. Buscar informações do cliente para a notificação
        SELECT email INTO client_email FROM public.profiles WHERE id = NEW.user_id;
        
        -- Itera sobre todos os itens do pedido para calcular a comissão por vendedor
        FOR item IN
            SELECT 
                oi.seller_id, 
                SUM(oi.price * oi.quantity) AS total_venda_seller
            FROM 
                public.order_items oi
            WHERE 
                oi.order_id = NEW.id
            GROUP BY 
                oi.seller_id
        LOOP
            -- 1. Calcular a comissão (8% do total de venda do vendedor)
            commission_amount := item.total_venda_seller * commission_rate;
            
            -- 2. Inserir na tabela 'commissions' (para rastreamento de pagamento ao admin)
            INSERT INTO public.commissions (order_id, seller_id, amount, status)
            VALUES (NEW.id, item.seller_id, commission_amount, 'pending');
            
            -- 3. Inserir na tabela 'financial_transactions' (para rastreamento da dedução)
            INSERT INTO public.financial_transactions (order_id, seller_id, commission_amount, status)
            VALUES (NEW.id, item.seller_id, commission_amount, 'commission_deducted');
            
        END LOOP;
        
        -- 4. Inserir notificação para o administrador
        INSERT INTO public.admin_notifications (message, type, related_id)
        VALUES (
            'O cliente ' || COALESCE(client_email, 'Desconhecido') || ' confirmou a entrega do Pedido #' || SUBSTRING(NEW.id::text, 1, 8) || '. Comissão processada.',
            'delivery_confirmed',
            NEW.id
        );
        
    END IF;
    
    RETURN NEW;
END;
$$;