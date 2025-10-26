ALTER TABLE public.profiles
ADD COLUMN delivery_scope TEXT[];

-- Opcional: Adicionar um valor padrão seguro (todo o país) para perfis existentes, se necessário, mas vamos deixar nulo para forçar a configuração.