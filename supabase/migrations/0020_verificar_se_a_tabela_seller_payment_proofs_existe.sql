-- Verificar se a tabela seller_payment_proofs existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'seller_payment_proofs'
) AS table_exists;