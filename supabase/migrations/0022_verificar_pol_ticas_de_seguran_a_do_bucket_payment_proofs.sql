-- Listar todas as políticas do bucket payment-proofs
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'storage.objects' 
AND qual LIKE '%payment-proofs%';