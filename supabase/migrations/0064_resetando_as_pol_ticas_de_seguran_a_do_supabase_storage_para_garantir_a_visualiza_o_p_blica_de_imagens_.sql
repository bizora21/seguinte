-- Apaga as políticas existentes para garantir uma configuração limpa e evitar erros.
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- 1. Política de Visualização Pública (ESSENCIAL PARA AS IMAGENS APARECEREM)
-- Permite que QUALQUER PESSOA (visitantes, usuários, etc.) veja as imagens no bucket 'product-images'.
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Política de Upload para Usuários Autenticados
-- Permite que usuários LOGADOS (vendedores, admin) façam upload de arquivos para o bucket 'product-images'.
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );