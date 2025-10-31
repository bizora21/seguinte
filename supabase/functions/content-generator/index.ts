// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// @ts-ignore
const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    },
  },
)

// Função para simular a resposta estruturada da IA
// @ts-ignore
function generateMockContent(keyword: string) {
    const title = `Guia Definitivo: Como Dominar a Venda de ${keyword} em Moçambique`
    const slug = `como-dominar-venda-${keyword.toLowerCase().replace(/\s/g, '-')}`
    const metaDescription = `Aprenda as melhores estratégias para vender ${keyword} online na LojaRápida. Dicas de logística, SEO e pagamento na entrega.`
    const content = `
# Introdução: Oportunidade de Ouro em Moçambique

O mercado de e-commerce em Moçambique está crescendo exponencialmente, e a venda de **${keyword}** é uma das áreas mais promissoras. A LojaRápida oferece a plataforma perfeita para você alcançar clientes em Maputo, Matola, Beira e todas as províncias.

## 1. Otimizando seu Produto para Vendas Rápidas

Para vender ${keyword} com sucesso, a apresentação é tudo.

### 1.1. Fotos de Alta Qualidade
Use fotos claras e com boa iluminação. Lembre-se: a primeira imagem é a que vende!

### 1.2. Descrição que Converte
Sua descrição deve ser detalhada, focando nos benefícios. Use listas:
*   **Benefício 1:** Entrega rápida em 1-5 dias úteis.
*   **Benefício 2:** Pagamento na entrega (COD).
*   **Benefício 3:** Garantia de satisfação.

## 2. Estratégias de Logística e Entrega

Na LojaRápida, a logística é simplificada. Certifique-se de que seu estoque esteja sempre atualizado para evitar cancelamentos.

## 3. Conclusão e Chamada para Ação

Pronto para começar a vender ${keyword}? Junte-se à nossa comunidade de vendedores e use o poder do Pagamento na Entrega para escalar seu negócio.

[CTA: Cadastre-se como Vendedor na LojaRápida e comece a vender hoje!]
`
    const imagePrompt = `Foto de alta qualidade de um vendedor moçambicano sorrindo, segurando um ${keyword} com o logo da LojaRápida ao fundo. Estilo vibrante e profissional.`
    
    return {
        title,
        slug,
        meta_description: metaDescription,
        content,
        image_prompt: imagePrompt,
        secondary_keywords: ['e-commerce moçambique', 'vender online', keyword.toLowerCase(), 'pagamento na entrega', 'logística mz'],
        external_links: [
            { title: 'Estatísticas de E-commerce em África', url: 'https://www.exemplo-autoridade.com/estatisticas-africa' },
            { title: 'Guia de Empreendedorismo em Moçambique', url: 'https://www.exemplo-autoridade.com/empreendedorismo-mz' }
        ],
        internal_links: [
            { title: 'Ver Produtos de ' + keyword, url: '/produtos?q=' + keyword.toLowerCase() },
            { title: 'Configurações da Minha Loja', url: '/dashboard/seller?tab=settings' }
        ],
        suggested_category: 'Vendas Online',
        seo_score: 92,
        readability_score: 'Excelente'
    }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const url = new URL(req.url);
  const keyword = url.searchParams.get('keyword');
  
  // 1. Autenticação (Simplesmente verifica se há um token, assumindo que o RLS no DB fará a verificação de Admin)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  
  if (!keyword) {
      return new Response(JSON.stringify({ error: 'Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
  }

  try {
    // Simulação de chamada à IA
    const generatedContent = generateMockContent(keyword);
    
    return new Response(JSON.stringify({ data: generatedContent }), {
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})