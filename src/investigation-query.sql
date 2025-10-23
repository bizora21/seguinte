-- 🔍 INVESTIGAÇÃO FORENSE - PASSE 1
-- Substitua 'ID_DO_PEDIDO_AQUI' pelo ID real do pedido que não aparece
-- Substitua 'ID_DO_VENDEDOR_AQUI' pelo ID real do vendedor

SELECT
  o.id AS order_id,
  o.user_id AS client_id,
  o.status,
  o.created_at,
  oi.id AS order_item_id,
  oi.product_id,
  oi.quantity,
  oi.price,
  p.name AS product_name,
  p.seller_id AS product_seller_id,
  p.stock AS product_stock
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.id = 'ID_DO_PEDIDO_AQUI';

-- 🔍 VERIFICAÇÃO ADICIONAL - Verifique se o vendedor realmente existe
SELECT 
  id, 
  email, 
  role, 
  store_name, 
  created_at
FROM profiles 
WHERE id = 'ID_DO_VENDEDOR_AQUI';