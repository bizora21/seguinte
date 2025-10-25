CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    item RECORD;
    commission_rate NUMERIC := 0.08; -- 8% de comissão
    commission_amount NUMERIC;
    seller_payout NUMERIC;
BEGIN
    -- Verifica se o status mudou para 'completed'
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        
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
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Criar o Trigger
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
CREATE TRIGGER on_order_completed
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_order_completion();