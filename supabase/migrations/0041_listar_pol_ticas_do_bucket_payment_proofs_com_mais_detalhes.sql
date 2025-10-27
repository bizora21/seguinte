SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  tablename,
  with_check,
  qual
FROM pg_policies
WHERE tablename = 'objects' AND with_check LIKE '%payment-proofs%';