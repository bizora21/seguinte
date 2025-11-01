-- Adicionar colunas necessárias à tabela blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.blog_categories(id),
ADD COLUMN IF NOT EXISTS image_prompt TEXT,
ADD COLUMN IF NOT EXISTS image_alt_text TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at ON public.blog_posts(status, published_at DESC);