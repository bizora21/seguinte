-- Garante que o bucket 'product-images' (usado para blog e produtos) seja público
-- Esta política permite que qualquer pessoa leia (SELECT) os objetos no bucket.
CREATE POLICY "Public read access for product-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );