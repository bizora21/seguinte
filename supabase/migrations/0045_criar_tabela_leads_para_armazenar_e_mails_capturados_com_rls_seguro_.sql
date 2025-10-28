-- Tabela para armazenar leads de marketing
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT, -- Ex: 'popup', 'newsletter'
  status TEXT DEFAULT 'subscribed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Obrigatório)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS:
-- 1. Permitir que usuários anônimos/autenticados insiram leads (para o pop-up)
CREATE POLICY "Allow public insert of leads" ON public.leads 
FOR INSERT WITH CHECK (true);

-- 2. Permitir que o administrador (lojarapidamz@outlook.com) veja todos os leads
CREATE POLICY "Admin full access to leads" ON public.leads 
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com'::text) WITH CHECK (auth.email() = 'lojarapidamz@outlook.com'::text);