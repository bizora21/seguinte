-- Habilitar RLS na tabela de artigos publicados, se ainda não estiver habilitado
ALTER TABLE public.published_articles ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir, para evitar conflitos
DROP POLICY IF EXISTS "Public read access to published articles" ON public.published_articles;

-- Criar uma nova política que permite a leitura pública de artigos com status 'published'
CREATE POLICY "Public read access to published articles"
ON public.published_articles
FOR SELECT
USING (status = 'published'::text);