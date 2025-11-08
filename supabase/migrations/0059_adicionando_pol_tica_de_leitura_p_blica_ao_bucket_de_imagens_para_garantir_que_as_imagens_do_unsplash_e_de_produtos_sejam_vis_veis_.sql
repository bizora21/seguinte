-- Remover política de leitura pública antiga, se existir, para evitar duplicatas
DROP POLICY IF EXISTS "Allow public read access on product images" ON storage.objects;

-- Criar uma nova política que permite a qualquer pessoa ler (SELECT) objetos no bucket 'product-images'
CREATE POLICY "Allow public read access on product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');