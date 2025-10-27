-- Listar todas as políticas do bucket storage.objects
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'storage.objects' 
ORDER BY policyname;