-- 1. Permite que qualquer pessoa veja as imagens no bucket 'product-images'. Esta é a correção principal.
CREATE POLICY "Public Read Access for product-images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

-- 2. Permite que usuários autenticados (como o admin) façam upload de imagens nas pastas corretas.
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'blog-images' );

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'products' );

-- 3. Permite que os proprietários das imagens as atualizem ou excluam.
CREATE POLICY "Owners can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner );

CREATE POLICY "Owners can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.uid() = owner );