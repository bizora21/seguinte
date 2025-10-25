ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS store_description TEXT,
ADD COLUMN IF NOT EXISTS store_logo TEXT,
ADD COLUMN IF NOT EXISTS store_categories TEXT[];

-- Opcional: definir um logo padrão para perfis sem logo definido
UPDATE public.profiles
SET store_logo = COALESCE(store_logo, '/store-default.svg');