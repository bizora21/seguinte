-- Verificar se o trigger handle_order_completion existe na tabela orders
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_order_completion';