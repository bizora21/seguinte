-- Tabela para gerenciar tarefas de geração de conteúdo em segundo plano
CREATE TABLE public.generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed
  progress INTEGER NOT NULL DEFAULT 0, -- 0 to 100
  result_data JSONB, -- Armazena o JSON final do artigo
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Apenas o administrador pode ver e manipular jobs
CREATE POLICY "Admin full access to jobs" ON public.generation_jobs 
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com');

-- Trigger para atualizar 'updated_at'
CREATE TRIGGER update_generation_jobs_updated_at
BEFORE UPDATE ON public.generation_jobs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();