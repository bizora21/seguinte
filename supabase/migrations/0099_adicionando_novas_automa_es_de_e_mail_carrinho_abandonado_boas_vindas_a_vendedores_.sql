-- Inserir novas automações se ainda não existirem
INSERT INTO public.email_automations (id, name, description, is_enabled)
VALUES
  ('abandoned-cart', 'Recuperação de Carrinho Abandonado', 'Envia um e-mail 24h após um cliente não finalizar a compra.', false),
  ('seller-onboarding', 'Boas-vindas para Novos Vendedores', 'Envia uma série de e-mails com dicas para novos vendedores.', false)
ON CONFLICT (id) DO NOTHING;