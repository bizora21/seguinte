-- 1. Criar o bucket 'payment-proofs' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar política para permitir que VENDEDORES façam upload (INSERT)
-- Eles só podem inserir arquivos no caminho 'proofs/' e se estiverem autenticados.
-- Usamos DROP IF EXISTS para evitar erros de duplicação.
DROP POLICY IF EXISTS "Vendedores podem fazer upload de comprovantes" ON storage.objects;
CREATE POLICY "Vendedores podem fazer upload de comprovantes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = 'proofs' AND
  name LIKE (auth.uid()::text || '_%')
);

-- 3. Criar política para permitir leitura pública (SELECT)
-- Isso é necessário para que o Admin Dashboard possa exibir a URL pública do comprovante.
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');