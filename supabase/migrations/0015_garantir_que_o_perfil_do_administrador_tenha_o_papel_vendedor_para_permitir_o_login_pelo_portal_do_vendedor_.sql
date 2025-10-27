-- O administrador deve ter o papel 'vendedor' para usar o portal de login do vendedor.
UPDATE public.profiles
SET role = 'vendedor'
WHERE email = 'lojarapidamz@outlook.com';