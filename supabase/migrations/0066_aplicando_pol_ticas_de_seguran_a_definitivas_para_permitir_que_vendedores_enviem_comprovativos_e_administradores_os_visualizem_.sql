-- Permitir que vendedores autenticados façam upload de seus próprios comprovativos
CREATE POLICY "vendedores_podem_fazer_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Permitir que administradores leiam todos os comprovativos
CREATE POLICY "admins_podem_ler_comprovativos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid() AND email = 'lojarapidamz@outlook.com') IS NOT NULL
);