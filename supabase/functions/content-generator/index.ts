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
1.  **FORMATO DE SAÍDA:** A sua saída DEVE ser um objeto JSON contendo APENAS as seguintes chaves: "title", "slug", "meta_description", "html_content", "image_prompt", "secondary_keywords", "seo_score", "readability_score".
2.  **CONTEÚDO HTML (\`html_content\`):**
    *   O conteúdo DEVE ser um código HTML bem-formado.
    *   **ESTRUTURA DE TÍTULOS (OBRIGATÓRIO):** Use as tags \`<h2>\`, \`<h3>\`, e \`<h4>\` corretamente para estruturar o artigo. NUNCA pule um nível de título.
    *   **QUALIDADE E COMPRIMENTO:** O artigo DEVE ter entre 1200 e 1500 palavras. Escreva parágrafos longos e detalhados usando a tag \`<p>\`. Use a tag \`<strong>\` para negrito em pontos importantes.
    *   **LISTAS:** Use as tags \`<ul>\` e \`<li>\` para listas com marcadores.
    *   **CTA FINAL (OBRIGATÓRIO):** No final do artigo, inclua uma seção de Call-to-Action clara, incentivando o leitor a visitar o site da LojaRápida ou a se cadastrar como vendedor.
3.  **IMAGEM PROFISSIONAL:** Gere um \`image_prompt\` detalhado em inglês para uma imagem de alta qualidade, estilo fotográfico profissional, otimizada para Google Discover (16:9).
4.  **MÉTRICAS:** Gere \`seo_score\` (70-100) e \`readability_score\` (Ex: "Excelente", "Bom").

**EXEMPLO DE SAÍDA JSON OBRIGATÓRIA:**
\`\`\`json
{
  "title": "O Título Principal do Artigo",
  "slug": "o-slug-do-artigo",
  "meta_description": "A meta descrição otimizada aqui.",
  "html_content": "<h1>O Título Principal do Artigo</h1><p>Parágrafo de introdução longo e detalhado...</p><h2>Primeira Seção Principal</h2><p>Conteúdo da primeira seção...</p><h3>Subseção Importante</h3><p>Conteúdo da subseção...</p><h2>Conclusão e CTA</h2><p>Pronto para começar a vender? <a href='https://lojarapidamz.com/register'>Cadastre-se agora na LojaRápida!</a></p>",
  "image_prompt": "A detailed prompt in English...",
  "secondary_keywords": ["keyword1", "keyword2"],
  "seo_score": 92,
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