SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  tablename,
  with_check
FROM pg_policies
WHERE tablename = 'objects';