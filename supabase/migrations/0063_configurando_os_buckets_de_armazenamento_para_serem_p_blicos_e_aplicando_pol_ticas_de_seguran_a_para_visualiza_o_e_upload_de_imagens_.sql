-- =================================================================
-- CORREÇÃO PARA O BUCKET DE IMAGENS DE PRODUTO/BLOG ('product-images')
-- =================================================================

-- 1. Garante que o bucket 'product-images' exista e seja PÚBLICO.
-- Esta é a correção principal para que as URLs públicas funcionem.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpa políticas antigas para garantir um estado limpo.
DROP POLICY IF EXISTS "Public Read Access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their own images" ON storage.objects;

-- 3. Permite que qualquer pessoa VEJA as imagens no bucket 'product-images'.
CREATE POLICY "Public Read Access for product-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 4. Permite que usuários autenticados (admin) façam UPLOAD de imagens de blog.
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'blog-images' );

-- 5. Permite que usuários autenticados (vendedores) façam UPLOAD de imagens de produto.
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'products' );

-- 6. Permite que os proprietários das imagens as atualizem ou excluam.
CREATE POLICY "Owners can update their own images"
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner );

CREATE POLICY "Owners can delete their own images"
ON storage.objects FOR DELETE
USING ( auth.uid() = owner );


-- =================================================================
-- CORREÇÃO PREVENTIVA PARA O BUCKET DE COMPROVANTES ('payment-proofs')
-- =================================================================

-- 1. Garante que o bucket 'payment-proofs' exista e seja PÚBLICO.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpa políticas antigas.
DROP POLICY IF EXISTS "Public Read Access for payment-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can upload their own proofs" ON storage.objects;

-- 3. Permite que qualquer pessoa com o link VEJA os comprovantes.
CREATE POLICY "Public Read Access for payment-proofs"
ON storage.objects FOR SELECT
USING ( bucket_id = 'payment-proofs' );

-- 4. Permite que vendedores autenticados façam UPLOAD de seus próprios comprovantes.
CREATE POLICY "Sellers can upload their own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL );