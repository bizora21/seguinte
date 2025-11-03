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

// Função para gerar o prompt avançado
const createAdvancedPrompt = (keyword: string, context?: string, audience?: string, type?: string) => {
  const ctx = context || 'Moçambique';
  const aud = audience || 'empreendedores';
  const content_type = type || 'Guia Completo';
  
  // Palavras-chave secundárias obrigatórias para SEO local
  const secondary_keywords = ["vender online em Moçambique", "empreendedorismo moçambicano", "logística Maputo", "pagamento na entrega"];

  return `
Você é um jornalista moçambicano, especialista em SEO e Growth Hacking. Sua missão é escrever um artigo de blog exclusivo e de alta qualidade para a LojaRápida.

**TEMA PRINCIPAL:** "${content_type}" sobre a palavra-chave: "${keyword}"
**CONTEXTO LOCAL:** "${ctx}"
**PÚBLICO-ALVO:** "${aud}"

**REGRAS ESTRITAS DE GERAÇÃO:**
1.  **Exclusividade e Profundidade:** O artigo deve ter no mínimo 1200 palavras (simuladas por conteúdo detalhado). Deve ser 100% original e focado em fornecer valor prático para o público moçambicano.
2.  **Tom e Humanização:** Escreva como uma conversa envolvente. Use referências a cidades, culturas e a realidade de Moçambique.
3.  **Estrutura:** Título (H1), introdução, corpo com subtítulos (H2/H3) e conclusão com um CTA claro.
4.  **Formatação:** Use **Markdown** para todo o conteúdo. Garanta que o conteúdo seja limpo e bem estruturado. **NÃO** use caracteres especiais desnecessários nos títulos e subtítulos (ex: \`##\`, \`***\`). O Markdown deve ser estrito (ex: \`## Título\`).
5.  **Meta Descrição:** A meta descrição deve ser altamente persuasiva e **NÃO** deve conter clichês como "descubra", "confira", "veja". Foque no valor e na ação.
6.  **SEO Avançado:** Use a palavra-chave principal ("${keyword}") e as secundárias ("${secondary_keywords.join('", "')}") de forma natural e estratégica ao longo do texto.
7.  **Imagem Profissional:** Gere um \`image_prompt\` detalhado em inglês para uma imagem de alta qualidade, estilo fotográfico profissional, otimizada para Google Discover (16:9).
8.  **Métricas:** Gere um \`seo_score\` (70-100) e \`readability_score\` (Ex: "Excelente", "Bom").

**FORMATO DE SAÍDA OBRIGATÓRIO:**
Retorne APENAS um objeto JSON estruturado exatamente como abaixo. O campo \`content\` deve conter o artigo completo em Markdown.

\`\`\`json
{
  "title": "O título H1 do artigo aqui",
  "slug": "o-slug-do-artigo-aqui",
  "meta_description": "A meta descrição (até 160 caracteres) aqui, focada em valor e sem clichês.",
  "content": "O artigo completo em markdown aqui, com no mínimo 1200 palavras simuladas por profundidade de conteúdo.",
  "image_prompt": "A detailed prompt in English for a high-quality, professional photograph-style image relevant to the article's theme.",
  "secondary_keywords": ["${secondary_keywords[0]}", "${secondary_keywords[1]}", "palavra-chave-adicional"],
  "seo_score": 92,
  "readability_score": "Excelente",
  "context": "${ctx}",
  "audience": "${aud}",
  "external_links": [
    { "title": "Referência Externa 1", "url": "https://exemplo.com/ref1" }
  ],
  "internal_links": [
    { "title": "Artigo Interno Relacionado", "url": "/blog/slug-interno" }
  ]
}
\`\`\`
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

        console.log(`DEBUG: Iniciando geração de conteúdo para: ${keyword} por user ${userId}`);
        
        // --- CHAMADA REAL À API DO OPENAI ---
        // @ts-ignore
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        if (!OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY não configurada como secret.');
        }
        
        const advancedPrompt = createAdvancedPrompt(keyword, context, audience, type);
        
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Modelo eficiente e capaz de JSON
                messages: [
                    { role: "system", content: "Você é um assistente de SEO e Growth Hacking. Sua saída deve ser APENAS um objeto JSON válido, seguindo o formato estrito fornecido pelo usuário." },
                    { role: "user", content: advancedPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            }),
        });

        if (!aiResponse.ok) {
            const errorBody = await aiResponse.json();
            console.error("OpenAI API Error:", errorBody);
            throw new Error(`Falha na API do OpenAI: ${errorBody.error?.message || aiResponse.statusText}`);
        }
        
        const aiData = await aiResponse.json();
        const rawContent = aiData.choices[0].message.content;
        
        // 2. Parse e Validação do Conteúdo
        let generatedContent;
        try {
            generatedContent = JSON.parse(rawContent);
        } catch (e) {
            console.error("Failed to parse AI JSON output:", rawContent);
            throw new Error("A IA não retornou um JSON válido. Tente novamente.");
        }
        
        // 3. Inserção no Banco de Dados
        const { data: draft, error: insertError } = await supabaseServiceRole
            .from('content_drafts')
            .insert({
                user_id: userId,
                keyword: keyword,
                status: 'draft',
                title: generatedContent.title,
                slug: generatedContent.slug,
                meta_description: generatedContent.meta_description,
                content: generatedContent.content,
                seo_score: generatedContent.seo_score,
                context: generatedContent.context,
                audience: generatedContent.audience,
                image_prompt: generatedContent.image_prompt,
                secondary_keywords: generatedContent.secondary_keywords,
                external_links: generatedContent.external_links,
                internal_links: generatedContent.internal_links,
                readability_score: generatedContent.readability_score,
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