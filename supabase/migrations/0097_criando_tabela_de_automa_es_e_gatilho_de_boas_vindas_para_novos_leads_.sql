-- 1. Tabela para gerir o estado das automações
CREATE TABLE IF NOT EXISTS public.email_automations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Políticas de Segurança (Apenas Admin)
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_automations" ON public.email_automations;
CREATE POLICY "admin_full_access_automations" ON public.email_automations
  FOR ALL
  USING (auth.email() = 'lojarapidamz@outlook.com')
  WITH CHECK (auth.email() = 'lojarapidamz@outlook.com');

-- 3. Inserir as automações padrão (se não existirem)
INSERT INTO public.email_automations (id, name, description, is_enabled)
VALUES
  ('welcome-series', 'Série de Boas-vindas (Leads)', 'Sequência de e-mails para novos leads capturados.', true),
  ('abandoned-cart', 'Recuperação de Carrinho Abandonado', 'E-mail enviado após o abandono do carrinho.', true),
  ('reengagement', 'Campanha de Reengajamento', 'E-mail com cupom para clientes inativos.', false),
  ('seller-onboarding', 'Boas-vindas ao Vendedor', 'E-mail automático para novos vendedores.', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Função que será chamada pelo gatilho
CREATE OR REPLACE FUNCTION public.handle_new_lead_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  automation_enabled BOOLEAN;
BEGIN
  -- Verificar se a automação de boas-vindas está ativa
  SELECT is_enabled INTO automation_enabled
  FROM public.email_automations
  WHERE id = 'welcome-series';

  -- Se estiver ativa, invocar a Edge Function
  IF automation_enabled THEN
    PERFORM net.http_post(
      url:='https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/email-sender',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '"}'::jsonb,
      body:=jsonb_build_object(
        'to', new.email,
        'subject', 'Bem-vindo(a) à LojaRápida! 🎉',
        'html', '<h1>Bem-vindo(a) à LojaRápida!</h1><p>Obrigado por se inscrever. Fique atento às nossas novidades e ofertas exclusivas.</p><p>Como prometido, aqui está o seu cupom de 10% de desconto na primeira compra: <strong>BEMVINDO10</strong></p>'
      )
    );
  END IF;
  
  RETURN new;
END;
$$;

-- 5. Gatilho na tabela 'leads'
DROP TRIGGER IF EXISTS on_new_lead_send_welcome ON public.leads;
CREATE TRIGGER on_new_lead_send_welcome
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_lead_welcome();