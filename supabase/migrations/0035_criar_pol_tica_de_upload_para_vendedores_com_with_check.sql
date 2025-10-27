-- Criar política para permitir upload de comprovantes por vendedores
CREATE POLICY "Vendedores podem fazer upload de comprovantes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'::text AND
  auth.uid() IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.role = 'vendedor'
  )
);