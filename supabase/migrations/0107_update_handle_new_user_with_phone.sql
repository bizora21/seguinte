CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role, phone,
    store_name, store_description, store_logo,
    store_categories, city, province, delivery_scope
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'store_name',
    NEW.raw_user_meta_data->>'store_description',
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'vendedor'
         THEN '/store-default.svg' ELSE NULL END,
    CASE WHEN jsonb_typeof(NEW.raw_user_meta_data->'store_categories') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'store_categories'))
         ELSE NULL END,
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'province',
    CASE WHEN jsonb_typeof(NEW.raw_user_meta_data->'delivery_scope') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'delivery_scope'))
         ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
