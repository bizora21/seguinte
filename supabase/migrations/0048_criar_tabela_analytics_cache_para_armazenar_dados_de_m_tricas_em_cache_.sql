-- Tabela para armazenar dados de métricas em cache
CREATE TABLE public.analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name TEXT NOT NULL UNIQUE, -- 'client_funnel', 'seller_funnel', 'keywords'
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Apenas o administrador pode ler, inserir e atualizar
CREATE POLICY "admin_full_access_analytics_cache" ON public.analytics_cache 
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com'::text) WITH CHECK (auth.email() = 'lojarapidamz@outlook.com'::text);