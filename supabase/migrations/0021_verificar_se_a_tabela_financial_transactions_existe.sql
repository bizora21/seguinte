-- Verificar se a tabela financial_transactions existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'financial_transactions'
) AS table_exists;