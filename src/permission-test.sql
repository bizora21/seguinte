-- 🔍 TESTE DE PERMISSÕES DO VENDEDOR
-- Substitua 'ID_DO_VENDEDOR_AQUI' pelo ID real

-- Testar se o vendedor pode ver seus pedidos
SET LOCAL ROLE authenticated;
SET request.jwt.claim.sub = 'ID_DO_VENDEDOR_AQUI';

-- Tentar buscar pedidos (simulando a query do vendedor)
SELECT 
  o.id,
  o.total_amount,
  o.status,
  o.created_at,
  oi.product_id,
  oi.quantity,
  oi.price,
  p.seller_id
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.seller_id = 'ID_DO_VENDEDOR_AQUI'
ORDER BY o.created_at DESC;

-- Resetar para investigador
RESET request.jwt.claim.sub;
RESET LOCAL ROLE;