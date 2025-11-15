-- Tabela para armazenar avaliações de produtos
CREATE TABLE public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que um usuário só pode avaliar um produto uma vez
  UNIQUE (product_id, user_id)
);

-- Habilitar RLS (Obrigatório)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ler todas as avaliações
CREATE POLICY "Authenticated users can view all reviews" ON public.product_reviews 
FOR SELECT TO authenticated USING (true);

-- Policy: Usuários podem inserir suas próprias avaliações
CREATE POLICY "Users can insert their own reviews" ON public.product_reviews 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar suas próprias avaliações
CREATE POLICY "Users can update their own reviews" ON public.product_reviews 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar suas próprias avaliações
CREATE POLICY "Users can delete their own reviews" ON public.product_reviews 
FOR DELETE TO authenticated USING (auth.uid() = user_id);