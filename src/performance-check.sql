-- 🔍 ANÁLISE DE PERFORMANCE

-- Verificar índices nas tabelas principais
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('orders', 'order_items', 'products', 'profiles')
ORDER BY tablename, indexname;

-- Analisar plano de execução da query do vendedor
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  o.id,
  o.total_amount,
  o.status,
  oi.product_id
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.seller_id = 'ID_DO_VENDEDOR_AQUI'
ORDER BY o.created_at DESC
LIMIT 10;