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
const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    },
  },
)

// Função para gerar o prompt avançado (simulação de chamada à IA)
const createAdvancedPrompt = (keyword: string, context?: string, audience?: string) => {
  const ctx = context || 'Moçambique';
  const aud = audience || 'empreendedores';
  return `
Você é um jornalista moçambicano, especialista em SEO e contador de histórias. Sua missão é escrever um artigo para o blog da LojaRápida que seja tão humano e envolvente que o leitor sentirá que foi escrito por um amigo.

Palavra-chave principal: "${keyword}"
Contexto: "${ctx}"
Público-alvo: "${aud}"

**REGRAS ESTRITAS:**
1.  **Tom e Humanização:** Escreva como uma conversa. Use referências a cidades, culturas e a realidade de Moçambique. Evite clichês e jargões técnicos.
2.  **Estrutura:** Título (H1), introdução, corpo (mínimo 1200 palavras com subtítulos H2/H3), conclusão com um CTA claro e direto.
3.  **Formatação:** Use markdown (**negrito**, *itálico*, [links](URL)).
4.  **SEO Avançado:** Use a palavra-chave "${keyword}" de forma natural. Inclua as secundárias: "vender online em Moçambique", "empreendedorismo moçambicano".
5.  **Humanização Absoluta:** Escreva o conteúdo final diretamente, sem rótulos como "Título:" ou "Introdução:".
6.  **Imagem Profissional:** Gere um \`image_prompt\` detalhado em inglês para uma imagem de alta qualidade, estilo fotográfico profissional, que seja relevante para o tema do artigo.
7.  **Dados Estruturados:** Gere um \`schema_data\` completo para Schema.org, que será usado para SEO avançado.

**FORMATO DE SAÍDA OBRIGATÓRIO:**
Retorne APENAS um objeto JSON estruturado exatamente como abaixo.
{
  "title": "O título H1 do artigo aqui",
  "meta_description": "A meta descrição (até 160 caracteres) aqui",
  "content": "O artigo completo em markdown aqui, sem caracteres especiais.",
  "image_prompt": "A detailed prompt in English for a high-quality, professional photograph-style image relevant to the article's theme.",
  "secondary_keywords": ["palavra1", "palavra2", "palavra3"],
  "focus_keyword": "${keyword}",
  "schema_data": {
    "@type": "Article",
    "headline": "O título H1 do artigo aqui",
    "description": "A meta descrição (até 160 caracteres) aqui"
  }
}
`;
};

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Autenticação e Extração do UID
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  // Usar o cliente Supabase para verificar o token e obter o UID
  const { data: userData, error: authError } = await supabaseServiceRole.auth.getUser(token)
  
  if (authError || !userData.user) {
    console.error('Authentication failed:', authError?.message)
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: corsHeaders })
  }
  
  const userId = userData.user.id;
  
  try {
    if (req.method === 'POST') {
        // Processamento da requisição POST
        const body = await req.json();
        const { keyword, context, audience, type } = body;
        
        if (!keyword) {
            return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
        }

        console.log(`DEBUG: Enfileirando job para: ${keyword} por user ${userId}`);
        
        // --- SIMULAÇÃO DE CONTEÚDO AVANÇADO (Substituindo a chamada real à IA) ---
        const advancedPrompt = createAdvancedPrompt(keyword, context, audience);
        console.log("DEBUG: Prompt enviado para IA (simulado):", advancedPrompt);
        
        // Simulação de conteúdo gerado pela IA (1200 palavras simuladas)
        const mockContent = {
            title: `Como Vender Online em ${context === 'nacional' ? 'Moçambique' : context} e Dominar o Mercado Local`,
            slug: keyword.toLowerCase().replace(/\s+/g, '-').slice(0, 50),
            meta_description: `Guia definitivo para ${audience} moçambicanos. Descubra as melhores estratégias para ${keyword} e maximize seus lucros na LojaRápida.`,
            content: `
# ${keyword} em Moçambique: O Guia Definitivo para o Sucesso

**Introdução: A Revolução Digital Chegou ao Nosso Mercado**

Olá! Se você está lendo isso, provavelmente já sentiu o cheiro da oportunidade. Vender online em Moçambique não é mais um luxo, é uma necessidade. Mas como fazer isso de forma inteligente, sem perder dinheiro e, o mais importante, construindo confiança com o cliente moçambicano?

**A Realidade do Pagamento na Entrega (COD)**

Em ${context}, a confiança é tudo. É por isso que o Pagamento na Entrega (COD) é o rei. Seus clientes querem ver o produto antes de pagar.

## Estratégias de SEO Local para ${context}

Não basta estar online; você precisa ser encontrado.

### Otimização para Maputo e Matola

Se o seu foco é a capital, use termos como **"loja de eletrônicos Maputo"** ou **"entrega rápida Matola"**. O Google adora relevância local.

### Palavras-chave Secundárias Essenciais

Integre naturalmente termos como **"empreendedorismo moçambicano"** e **"vender online em Moçambique"** em seus títulos e descrições.

## A Importância da Humanização no Atendimento

O cliente moçambicano valoriza o contacto pessoal. Use o chat da LojaRápida para responder rapidamente.

*   **Seja Rápido:** Responda em menos de 1 hora.
*   **Seja Claro:** Use português claro e evite jargões.
*   **Seja Amigável:** Trate o cliente como um vizinho.

## Logística e Entrega: O Segredo da LojaRápida

Nossa plataforma cuida da logística, mas você precisa embalar bem.

### Dicas de Embalagem

Use materiais resistentes. Lembre-se que o produto vai viajar por ${context}.

## Conclusão: Seu Próximo Passo

O sucesso está à sua espera. Comece hoje, use estas dicas e veja sua loja crescer.

[CTA: Cadastre-se Agora]
`,
            image_prompt: `A high-quality, professional photograph of a young Mozambican entrepreneur smiling confidently while holding a smartphone, standing in front of a vibrant market or modern city skyline in Maputo. Focus on bright colors and a sense of local success. Cinematic lighting, 8K resolution.`,
            secondary_keywords: ["vender online em Moçambique", "empreendedorismo moçambicano", "logística Maputo", "pagamento na entrega"],
            seo_score: Math.floor(Math.random() * 30) + 70, // 70-100
            context: context,
            audience: audience,
            // Adicionando campos para o frontend
            external_links: [{ title: "Lei de E-commerce em Moçambique", url: "https://gov.mz/lei-ecommerce" }],
            internal_links: [{ title: "Guia de Produtos Mais Vendidos", url: "/blog/produtos-mais-vendidos" }],
            readability_score: "Excelente",
            category_id: null, // Será preenchido no editor
        }
        
        const { data: draft, error: insertError } = await supabaseServiceRole
            .from('content_drafts')
            .insert({
                user_id: userId,
                keyword: keyword,
                status: 'draft',
                title: mockContent.title,
                slug: mockContent.slug,
                meta_description: mockContent.meta_description,
                content: mockContent.content,
                seo_score: mockContent.seo_score,
                context: mockContent.context,
                audience: mockContent.audience,
                // Novos campos
                image_prompt: mockContent.image_prompt,
                secondary_keywords: mockContent.secondary_keywords,
                external_links: mockContent.external_links,
                internal_links: mockContent.internal_links,
                readability_score: mockContent.readability_score,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error("DEBUG: FALHA NA INSERÇÃO DO RASCUNHO:", insertError);
            return new Response(JSON.stringify({ error: `Falha ao criar rascunho: ${insertError.message}` }), { status: 500, headers: corsHeaders })
        }
        
        console.log(`DEBUG: Rascunho inserido com sucesso! ID: ${draft.id}`);

        return new Response(JSON.stringify({ success: true, draftId: draft.id, status: 'draft_created' }), {
          headers: corsHeaders,
          status: 200, 
        })
    }
    
    // Se não for OPTIONS nem POST, retorna 405
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('Edge Function Error (Catch Block):', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})