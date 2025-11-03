ALTER TABLE public.content_drafts
ADD COLUMN context TEXT,
ADD COLUMN audience TEXT;

-- Opcional: Adicionar defaults se necessário, mas vamos mantê-los nulos por enquanto.