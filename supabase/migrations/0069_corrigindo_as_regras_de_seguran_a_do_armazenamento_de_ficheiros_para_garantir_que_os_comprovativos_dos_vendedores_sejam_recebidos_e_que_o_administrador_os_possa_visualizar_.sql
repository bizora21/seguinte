-- 1. Remover políticas antigas e potencialmente incorretas para garantir um estado limpo.
DROP POLICY IF EXISTS "Sellers can upload their own proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view all proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for proofs" ON storage.objects;

-- 2. Criar a política de UPLOAD para Vendedores.
-- Garante que um vendedor só pode enviar ficheiros para a sua própria pasta (ex: /payment-proofs/user-id-123/comprovativo.pdf)
CREATE POLICY "Sellers can upload their own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Criar a política de VISUALIZAÇÃO para o Administrador.
-- Permite que o email do administrador veja TODOS os ficheiros no bucket de comprovativos.
CREATE POLICY "Admin can view all proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND
  (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'lojarapidamz@outlook.com'
  ))
);