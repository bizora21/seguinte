-- Listar políticas para o bucket payment-proofs
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' AND
      (qual LIKE '%payment-proofs%' OR qual LIKE '%bucket_id%');