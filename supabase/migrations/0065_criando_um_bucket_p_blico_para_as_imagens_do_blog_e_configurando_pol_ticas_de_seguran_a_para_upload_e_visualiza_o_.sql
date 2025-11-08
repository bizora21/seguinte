-- 1. Criar o bucket para imagens do blog, se ainda não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir a visualização pública de imagens
CREATE POLICY "Public Read Access for Blog Images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'blog-images' );

-- 3. Política para permitir que administradores (ou a service_role da edge function) façam upload
CREATE POLICY "Allow Admin Upload for Blog Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-images' AND auth.email() = 'lojarapidamz@outlook.com' );