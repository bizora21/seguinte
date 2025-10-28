-- Tabela para gerenciar tarefas assíncronas
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'social_post', 'analytics_report'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payload JSONB NOT NULL, -- Dados necessários para a tarefa (ex: content, schedule_time)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Apenas o administrador pode ler e inserir
CREATE POLICY "admin_full_access_jobs" ON public.jobs 
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com'::text) WITH CHECK (auth.email() = 'lojarapidamz@outlook.com'::text);