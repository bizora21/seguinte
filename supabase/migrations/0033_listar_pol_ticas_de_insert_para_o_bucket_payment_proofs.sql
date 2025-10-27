-- Listar políticas de INSERT para o bucket payment-proofs
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' AND
      cmd = 'INSERT' AND
      qual LIKE '%payment-proofs%';