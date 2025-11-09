-- Drop any potentially conflicting old policies on the storage objects
DROP POLICY IF EXISTS "public_read_access_payment_proofs" ON storage.objects;
DROP POLICY IF EXISTS "seller_upload_payment_proofs" ON storage.objects;
DROP POLICY IF EXISTS "admin_manage_payment_proofs" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_payment_proofs" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_payment_proofs" ON storage.objects;

-- Create new, correct policies for the 'payment-proofs' bucket

-- 1. Public Read Access: Allows anyone to view files if they have the URL.
CREATE POLICY "public_read_access_payment_proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-proofs');

-- 2. Seller Upload Access: Allows authenticated sellers to upload into their own user-ID-named folder.
CREATE POLICY "seller_upload_payment_proofs" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Admin Update Access
CREATE POLICY "admin_update_payment_proofs" ON storage.objects
FOR UPDATE USING (bucket_id = 'payment-proofs' AND auth.email() = 'lojarapidamz@outlook.com');

-- 4. Admin Delete Access
CREATE POLICY "admin_delete_payment_proofs" ON storage.objects
FOR DELETE USING (bucket_id = 'payment-proofs' AND auth.email() = 'lojarapidamz@outlook.com');