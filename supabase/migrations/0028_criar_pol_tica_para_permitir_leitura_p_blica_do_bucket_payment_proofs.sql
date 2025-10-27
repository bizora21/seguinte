-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública" ON storage.objects
  FOR SELECT USING (
    bucket_id = (SELECT id FROM storage.buckets WHERE name = 'payment-proofs') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );