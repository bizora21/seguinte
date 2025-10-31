-- Tabela para armazenar artigos do blog
CREATE TABLE public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  meta_description TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured_image_url TEXT,
  external_links JSONB DEFAULT '[]'::jsonb,
  internal_links JSONB DEFAULT '[]'::jsonb,
  secondary_keywords TEXT[] DEFAULT '{}'::TEXT[],
  seo_score INTEGER DEFAULT 0,
  readability_score TEXT DEFAULT 'N/A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar trigger para atualizar 'updated_at'
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS (Obrigatório)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Política 1: Administrador tem acesso total (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access to blog posts" ON public.blog_posts 
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com'::text) WITH CHECK (auth.email() = 'lojarapidamz@outlook.com'::text);

-- Política 2: Usuários anônimos e autenticados podem LER artigos publicados
CREATE POLICY "Public read access to published blog posts" ON public.blog_posts 
FOR SELECT USING (status = 'published');