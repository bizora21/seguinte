-- Tabela para armazenar tokens de acesso de APIs externas (criptografados)
CREATE TABLE public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE, -- 'facebook', 'google_analytics', 'google_search_console'
  access_token TEXT NOT NULL, -- Token de acesso (deve ser criptografado no backend)
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Para armazenar IDs de página, contas, etc.
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Apenas o administrador pode ler, inserir ou atualizar
CREATE POLICY "admin_full_access_integrations" ON public.integrations 
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com'::text) WITH CHECK (auth.email() = 'lojarapidamz@outlook.com'::text);