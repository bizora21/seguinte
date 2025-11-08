-- 1. Remover a política de segurança antiga e defeituosa
DROP POLICY IF EXISTS "Admin full access to payment proofs" ON public.seller_payment_proofs;

-- 2. Criar uma nova política, mais segura e explícita, que permite ao admin VER todos os comprovativos
CREATE POLICY "admins_podem_ver_todos_os_comprovativos"
ON public.seller_payment_proofs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND email = 'lojarapidamz@outlook.com'
  )
);

-- 3. Criar políticas explícitas para ATUALIZAR e DELETAR, garantindo controlo total
CREATE POLICY "admins_podem_atualizar_comprovativos"
ON public.seller_payment_proofs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND email = 'lojarapidamz@outlook.com'
  )
);

CREATE POLICY "admins_podem_deletar_comprovativos"
ON public.seller_payment_proofs
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND email = 'lojarapidamz@outlook.com'
  )
);