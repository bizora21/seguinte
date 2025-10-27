-- 1. Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Vendedores podem fazer upload de comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- 2. Criar política para permitir que VENDEDORES façam upload (INSERT)
-- O nome do arquivo deve começar com o ID do usuário (auth.uid()) e estar no bucket 'payment-proofs'.
CREATE POLICY "Vendedores podem fazer upload de comprovantes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  name LIKE 'proofs/' || auth.uid()::text || '_%'
);

-- 3. Criar política para permitir leitura pública (SELECT)
-- Necessário para que o Admin Dashboard possa exibir a URL pública do comprovante.
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');