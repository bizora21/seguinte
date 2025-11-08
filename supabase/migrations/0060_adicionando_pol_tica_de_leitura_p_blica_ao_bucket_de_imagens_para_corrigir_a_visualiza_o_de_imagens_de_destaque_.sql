-- Name: Allow public read access to product and blog images

-- Define the policy
CREATE POLICY "Public read access for product and blog images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );