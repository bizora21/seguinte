-- 🔍 VERIFICAÇÃO DE INTEGRIDADE DOS DADOS

-- 1. Verificar orders sem items (dados órfãos)
SELECT 
  o.id AS orphan_order,
  o.created_at,
  o.user_id
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.id IS NULL;

-- 2. Verificar order_items sem orders
SELECT 
  oi.id AS orphan_item,
  oi.order_id,
  oi.product_id
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- 3. Verificar products sem seller
SELECT 
  p.id AS product_without_seller,
  p.name,
  p.seller_id
FROM products p
LEFT JOIN profiles pr ON p.seller_id = pr.id
WHERE pr.id IS NULL;

-- 4. Verificar consistência entre seller_id em products e profiles
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.seller_id AS product_seller_id,
  pr.id AS profile_id,
  pr.role AS profile_role
FROM products p
LEFT JOIN profiles pr ON p.seller_id = pr.id
WHERE pr.role != 'vendedor' OR pr.role IS NULL;