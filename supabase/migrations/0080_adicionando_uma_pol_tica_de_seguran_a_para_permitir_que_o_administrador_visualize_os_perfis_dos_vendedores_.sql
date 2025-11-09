-- Remove a política antiga se existir, para garantir uma aplicação limpa
DROP POLICY IF EXISTS "admin_can_read_all_profiles" ON public.profiles;

-- Cria a nova política que concede ao email do administrador permissão para ler todos os perfis
CREATE POLICY "admin_can_read_all_profiles" ON public.profiles
FOR SELECT TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com');