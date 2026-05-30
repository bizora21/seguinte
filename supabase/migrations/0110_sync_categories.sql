-- ============================================================================
-- Sincroniza a tabela `categories` com as 12 categorias hardcoded em
-- src/pages/ManageProduct.tsx (CATEGORIES array).
--
-- Estado anterior (4 categorias na BD):
--   Casa & Jardim (casa-e-jardim), Eletrônicos (eletronicos),
--   Esportes (esportes), Moda (moda)
--
-- Adiciona as 8 em falta + normaliza o slug 'casa' → 'casa-e-jardim'.
-- ============================================================================

-- 1) Garante constraint UNIQUE no slug (necessário para ON CONFLICT funcionar).
--    Caso já exista, o IF NOT EXISTS evita erro.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_slug_key' AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
END$$;

-- 2) Insere as 8 categorias em falta (idempotent — ON CONFLICT DO NOTHING).
INSERT INTO categories (name, slug) VALUES
  ('Livros',                'livros'),
  ('Acessórios',            'acessorios'),
  ('Móveis',                'moveis'),
  ('Alimentos',             'alimentos'),
  ('Beleza & Cosméticos',   'beleza'),
  ('Saúde',                 'saude'),
  ('Automotivo',            'automotivo'),
  ('Outros',                'outros')
ON CONFLICT (slug) DO NOTHING;

-- 3) Normaliza slug 'casa' → 'casa-e-jardim' (caso versão antiga exista).
--    No-op se já estiver correcto.
UPDATE categories SET slug = 'casa-e-jardim' WHERE slug = 'casa';

-- 4) Normaliza produtos que tenham sido criados com category='casa' (slug antigo
--    do array hardcoded de ManageProduct.tsx). Sem isto, esses produtos ficam
--    invisíveis ao filtrar por /busca?categoria=casa-e-jardim.
UPDATE products SET category = 'casa-e-jardim' WHERE category = 'casa';

-- ============================================================================
-- Resultado esperado:
--   - categories: 12 rows (4 originais + 8 novas; slug 'casa' → 'casa-e-jardim')
--   - products.category: nenhum row com 'casa' (todos passam a 'casa-e-jardim')
-- ============================================================================
