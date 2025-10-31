-- Tabela de Categorias do Blog
CREATE TABLE public.blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para categorias (leitura pública, escrita apenas por admin)
CREATE POLICY "Public read access to blog categories" ON public.blog_categories 
FOR SELECT USING (true);

CREATE POLICY "Admin full access to blog categories" ON public.blog_categories 
FOR ALL USING (auth.email() = 'lojarapidamz@outlook.com'::text);

-- Adicionar coluna category_id e image_prompt à tabela blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
ADD COLUMN image_prompt TEXT;

-- Inserir categorias iniciais (se não existirem)
INSERT INTO public.blog_categories (name, slug) VALUES
('Vendas Online', 'vendas-online'),
('Marketing Digital', 'marketing-digital'),
('Logística', 'logistica'),
('Notícias', 'noticias')
ON CONFLICT (name) DO NOTHING;