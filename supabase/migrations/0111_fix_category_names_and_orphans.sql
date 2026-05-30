-- ============================================================================
-- Corrige duas falhas resultantes da migration 0110:
--
-- 1. ENCODING MOJIBAKE -- os nomes das 4 categorias com caracteres acentuados
--    (Acessorios, Beleza & Cosmeticos, Moveis, Saude) foram inseridos com
--    encoding duplo (UTF-8 lido como Latin-1 e reencodado pelo SQL Editor).
--
--    Aqui usamos a sintaxe Postgres U&'...\NNNN...' (Unicode escape) para que
--    os caracteres acentuados sejam construidos pelo proprio Postgres a
--    partir dos codepoints, independente de como o ficheiro SQL e lido.
--
--    Codepoints usados:
--      \00e9 = e-acento-agudo
--      \00f3 = o-acento-agudo
--      \00fa = u-acento-agudo
--
-- 2. PRODUTOS ORFAOS -- existem produtos com category = 'geral' que nao tem
--    correspondencia na tabela `categories`. Sao invisiveis a qualquer filtro
--    do drawer. Migra para 'outros' (categoria existente).
-- ============================================================================

-- 1) Corrige encoding via Unicode escapes (so ASCII no ficheiro -> Postgres
--    monta os caracteres acentuados em UTF-8 puro).
UPDATE categories SET name = U&'Acess\00f3rios'           WHERE slug = 'acessorios';
UPDATE categories SET name = U&'Beleza & Cosm\00e9ticos'  WHERE slug = 'beleza';
UPDATE categories SET name = U&'M\00f3veis'               WHERE slug = 'moveis';
UPDATE categories SET name = U&'Sa\00fade'                WHERE slug = 'saude';

-- 2) Normaliza produtos com category='geral' -> 'outros'.
UPDATE products SET category = 'outros' WHERE category = 'geral';

-- ============================================================================
-- Verificacao apos executar:
--   SELECT name, slug FROM categories WHERE slug IN ('acessorios','beleza','moveis','saude');
--
--   SELECT DISTINCT category FROM products WHERE category = 'geral';
--   -> 0 rows
-- ============================================================================
