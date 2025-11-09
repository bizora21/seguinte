-- Limpa os links internos dos artigos já publicados
UPDATE public.published_articles
SET internal_links = '[]'::jsonb
WHERE internal_links IS NOT NULL AND internal_links != '[]'::jsonb;

-- Limpa os links internos dos rascunhos
UPDATE public.content_drafts
SET internal_links = '[]'::jsonb
WHERE internal_links IS NOT NULL AND internal_links != '[]'::jsonb;