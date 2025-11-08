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

// --- NOVO PROMPT OTIMIZADO PARA HTML ---
// @ts-ignore
const createHtmlPrompt = (keyword: string, context: string, audience: string, contentType: string) => {
  return `
Você é um jornalista moçambicano de elite, especialista em SEO e Growth Hacking. Sua missão é criar um artigo de blog em HTML para a LojaRápida.

**TEMA PRINCIPAL:** "${contentType}" sobre a palavra-chave: "${keyword}"
**CONTEXTO LOCAL:** "${context}"
**PÚBLICO-ALVO:** "${audience}"

**REGRAS ESTRITAS DE GERAÇÃO E ESTRUTURA (CRÍTICO PARA SEO E QUALIDADE HUMANA):**
1.  **FORMATO DE SAÍDA:** A sua saída DEVE ser um objeto JSON contendo APENAS as seguintes chaves: "title", "slug", "meta_description", "html_content", "image_prompt", "secondary_keywords", "external_links", "internal_links", "seo_score", "readability_score".
2.  **TÍTULO (\`title\`):** Crie um título amigável, otimizado para SEO e cliques. **NUNCA** use termos como 'SEO', 'CTA' ou frases que pareçam geradas por máquina.
3.  **CONTEÚDO HTML (\`html_content\`):**
    *   O conteúdo DEVE ser um código HTML bem-formado.
    *   **ESTRUTURA DE TÍTULOS (OBRIGATÓRIO):** Use as tags \`<h2>\`, \`<h3>\`, e \`<h4>\` corretamente para estruturar o artigo. NUNCA pule um nível de título.
    *   **QUALIDADE E COMPRIMENTO:** O artigo DEVE ter entre 1200 e 1500 palavras. Escreva parágrafos longos e detalhados usando a tag \`<p>\`. Use a tag \`<strong>\` para negrito em pontos importantes.
    *   **LISTAS:** Use as tags \`<ul>\` e \`<li>\` para listas com marcadores.
    *   **CTA NATURAL (OBRIGATÓRIO):** No final do artigo, integre de forma natural uma seção de Call-to-Action, incentivando o leitor a visitar o site da LojaRápida ou a se cadastrar como vendedor. **NÃO use 'CTA' como título.**
4.  **LINKS (OBRIGATÓRIO):**
    *   **\`external_links\`:** Gere 2-3 links externos para sites de alta autoridade (notícias, estudos, fontes confiáveis) que sejam relevantes para o conteúdo. O formato deve ser uma lista de objetos: \`[{ "title": "Nome do Link", "url": "https://..." }]\`.
    *   **\`internal_links\`:** Gere 2-3 links internos para páginas da LojaRápida (ex: /produtos, /lojas, /sobre-nos). O formato deve ser o mesmo dos links externos.
5.  **IMAGEM PROFISSIONAL:** Gere um \`image_prompt\` detalhado em inglês para uma imagem de alta qualidade, estilo fotográfico profissional, otimizada para Google Discover (16:9).
6.  **MÉTRICAS:** Gere \`seo_score\` (70-100) e \`readability_score\` (Ex: "Excelente", "Bom").

**EXEMPLO DE SAÍDA JSON OBRIGATÓRIA:**
\`\`\`json
{
  "title": "Guia Completo para Vender Online em Maputo em 2025",
  "slug": "guia-vender-online-maputo-2025",
  "meta_description": "Descubra as melhores estratégias e plataformas para começar a vender online em Maputo. Dicas práticas para empreendedores locais.",
  "html_content": "<h1>Guia Completo para Vender Online em Maputo em 2025</h1><p>O comércio eletrónico em Maputo está a crescer exponencialmente...</p><h2>Entendendo o Mercado Digital de Maputo</h2><p>...</p><h3>Desafios e Oportunidades</h3><p>...</p><h2>Conclusão: Seu Próximo Passo no E-commerce</h2><p>Agora que você tem as ferramentas, está pronto para transformar sua ideia em um negócio de sucesso. A LojaRápida oferece a plataforma ideal para começar. <a href='https://lojarapidamz.com/register'>Cadastre-se como vendedor hoje mesmo e alcance clientes em todo Moçambique!</a></p>",
  "image_prompt": "A professional photograph of a small business owner in Maputo, Mozambique, smiling while packing an order. The background shows a vibrant local market scene, aspect ratio 16:9.",
  "secondary_keywords": ["e-commerce moçambique", "negócios digitais maputo", "plataforma de vendas online"],
  "external_links": [{ "title": "Relatório de E-commerce na África Austral - FMI", "url": "https://www.imf.org/..." }],
  "internal_links": [{ "title": "Conheça as Lojas em Destaque", "url": "/lojas" }],
  "seo_score": 95,
  "readability_score": "Excelente"
}
\`\`\`
`;
};

// --- FUNÇÃO PRINCIPAL DA EDGE FUNCTION ---
// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  const token = authHeader.replace('Bearer ', '')
  // @ts-ignore
  const supabaseAnon = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const body = await req.json()
      const { action, keyword, context, audience, type } = body

      // @ts-ignore
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured.')

      if (action === 'generate') {
        if (!keyword) return new Response(JSON.stringify({ error: 'Keyword is required' }), { status: 400, headers: corsHeaders })

        const prompt = createHtmlPrompt(keyword, context, audience, type)

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 4096,
            messages: [{ role: 'system', content: 'You are an expert SEO content writer for Mozambique. Your output must be a single, valid JSON object.' }, { role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        })

        if (!openaiResponse.ok) {
          const errorBody = await openaiResponse.json()
          throw new Error(`OpenAI API Error: ${errorBody.error?.message || openaiResponse.statusText}`)
        }

        const openaiData = await openaiResponse.json()
        const rawContent = openaiData.choices[0].message.content
        const generatedContent = JSON.parse(rawContent)

        if (!generatedContent.title || !generatedContent.html_content) {
          throw new Error('AI returned invalid content format.')
        }

        const { data: draft, error: insertError } = await supabaseServiceRole
          .from('content_drafts')
          .insert({
            user_id: user.id,
            keyword: keyword,
            model: 'gpt-4o',
            status: 'draft',
            title: generatedContent.title,
            slug: generatedContent.slug,
            meta_description: generatedContent.meta_description,
            content: generatedContent.html_content, // SALVANDO HTML
            seo_score: generatedContent.seo_score,
            context: context,
            audience: audience,
            image_prompt: generatedContent.image_prompt,
            secondary_keywords: generatedContent.secondary_keywords,
            readability_score: generatedContent.readability_score,
            external_links: generatedContent.external_links,
            internal_links: generatedContent.internal_links,
          })
          .select('id')
          .single()

        if (insertError) throw new Error(`Failed to create draft: ${insertError.message}`)

        return new Response(JSON.stringify({ success: true, draftId: draft.id }), { headers: corsHeaders, status: 200 })
      }
      
      // Ações de reanálise e outras foram removidas para simplificar e focar na correção principal.

      return new Response(JSON.stringify({ error: 'Action not recognized' }), { status: 400, headers: corsHeaders })
    }
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 })
  }
})