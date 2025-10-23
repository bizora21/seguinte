-- 🔍 DEBUG COMPLETO - VERIFICAR ESTRUTURA DOS DADOS

-- 1. Verificar estrutura da tabela order_items
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se há dados em order_items
SELECT 
  COUNT(*) as total_order_items,
  COUNT(DISTINCT seller_id) as unique_sellers,
  COUNT(DISTINCT order_id) as unique_orders
FROM order_items;

-- 3. Verificar dados de exemplo (últimos 10 itens)
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.seller_id,
  oi.user_id,
  oi.quantity,
  oi.price,
  oi.created_at,
  o.status as order_status,
  p.name as product_name,
  pr.email as seller_email,
  pr.role as seller_role
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN profiles pr ON oi.seller_id = pr.id
ORDER BY oi.created_at DESC
LIMIT 10;

-- 4. Verificar políticas RLS na tabela order_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'order_items';

-- 5. Testar query específica para um seller (substitua ID_DO_VENDEDOR)
SELECT 
  oi.*,
  o.*,
  p.*
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
INNER JOIN products p ON oi.product_id = p.id
WHERE oi.seller_id = 'ID_DO_VENDEDOR_AQUI'
ORDER BY oi.created_at DESC;