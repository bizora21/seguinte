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

// Função para gerar o prompt avançado (usando Anthropic)
const createAdvancedPrompt = (keyword: string, context?: string, audience?: string, type?: string) => {
  const ctx = context || 'Moçambique';
  const aud = audience || 'empreendedores';
  const content_type = type || 'Guia Completo';
  
  // Palavras-chave secundárias obrigatórias para SEO local
  const secondary_keywords = ["vender online em Moçambique", "empreendedorismo moçambicano", "logística Maputo", "pagamento na entrega"];

  return `
Você é um jornalista moçambicano, especialista em SEO de alto nível e Growth Hacking. Sua missão é escrever um artigo de blog exclusivo e de alta qualidade para a LojaRápida.

**TEMA PRINCIPAL:** "${content_type}" sobre a palavra-chave: "${keyword}"
**CONTEXTO LOCAL:** "${ctx}"
**PÚBLICO-ALVO:** "${aud}"

**REGRAS ESTRITAS DE GERAÇÃO E ESTRUTURA (CRÍTICO PARA SEO):**
1.  **Profundidade e Qualidade:** O artigo deve ser extenso e detalhado, simulando no mínimo 1200 palavras através da profundidade e riqueza do conteúdo. Deve ser 100% original e focado em fornecer valor prático para o público moçambicano.
2.  **Estrutura Markdown Rigorosa:**
    *   O título principal (H1) deve ser fornecido APENAS no campo \`title\` do JSON.
    *   Use \`##\` para os títulos principais das seções (H2).
    *   Use \`###\` para subtítulos dentro das seções (H3).
    *   Use \`**negrito**\` para destacar termos importantes.
    *   Use listas com \`* \` (asterisco e espaço).
    *   Garanta que o conteúdo seja limpo e bem estruturado.
3.  **Meta Descrição:** A meta descrição deve ser altamente persuasiva, com no máximo 160 caracteres, e focar no valor e na ação. **Deve ser escrita em tom humano e envolvente.**
4.  **SEO Avançado:** Use a palavra-chave principal ("${keyword}") e as secundárias ("${secondary_keywords.join('", "')}") de forma natural e estratégica ao longo do texto, especialmente nos H2 e H3.
5.  **Links Externos Relevantes:** Inclua 1 a 3 links externos relevantes para fontes de autoridade (ex: sites governamentais, estatísticas, notícias de Moçambique).
6.  **CTA:** Inclua um Call-to-Action claro no final do artigo usando o formato \`[CTA: Texto do Botão]\`.
7.  **Imagem Profissional:** Gere um \`image_prompt\` detalhado em inglês para uma imagem de alta qualidade, estilo fotográfico profissional, otimizada para Google Discover (16:9).
8.  **Métricas:** Gere um \`seo_score\` (70-100) e \`readability_score\` (Ex: "Excelente", "Bom").

**FORMATO DE SAÍDA OBRIGATÓRIO:**
Retorne APENAS um objeto JSON estruturado exatamente como abaixo. O campo \`content\` deve conter o artigo completo em Markdown.

\`\`\`json
{
  "title": "O título H1 do artigo aqui",
  "slug": "o-slug-do-artigo-aqui",
  "meta_description": "A meta descrição (até 160 caracteres) aqui, focada em valor e sem clichês.",
  "content": "## Introdução ao Tema\\n\\nO artigo começa aqui, com parágrafos detalhados e uso de **negrito** para termos chave.\\n\\n## Título da Primeira Seção (H2)\\n\\n### Subtítulo da Seção (H3)\\n\\n* Item de lista 1\\n* Item de lista 2\\n\\nMais conteúdo detalhado aqui.\\n\\n## Conclusão\\n\\nResumo e chamada final.\\n\\n[CTA: Comece a Vender Agora na LojaRápida]",
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

// Função para gerar o prompt de reanálise (usando OpenAI)
const createReanalyzePrompt = (draft: any) => {
    return `
Você é um especialista em SEO e Growth Hacking. Sua tarefa é analisar o conteúdo Markdown fornecido abaixo e fornecer uma reavaliação do SEO Score e Readability Score.

**Palavra-chave Principal:** ${draft.keyword}
**Conteúdo Atual (Markdown):**
---
${draft.content}
---

**REGRAS ESTRITAS DE REANÁLISE:**
1.  **Foco:** Avalie a densidade da palavra-chave, a estrutura de títulos (H2, H3), a profundidade do conteúdo e a clareza da escrita.
2.  **Métricas:** Gere um novo \`seo_score\` (70-100) e \`readability_score\` (Ex: "Excelente", "Bom", "Mediano").
3.  **Saída:** Retorne APENAS um objeto JSON estruturado exatamente como abaixo.

**FORMATO DE SAÍDA OBRIGATÓRIO:**
\`\`\`json
{
  "seo_score": 95,
  "readability_score": "Excelente",
  "suggestions": [
    "Aumentar a densidade da palavra-chave principal em 0.5%.",
    "Adicionar um link interno para a página de Lojas."
  ]
}
\`\`\`
`;
}


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
        const body = await req.json();
        const { action } = body;
        
        // --- AÇÃO: GERAR CONTEÚDO INICIAL (USANDO ANTHROPIC) ---
        if (action === 'generate') {
            const { keyword, context, audience, type } = body;
            
            if (!keyword) {
                return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
            }

            console.log(`DEBUG: Iniciando geração de conteúdo para: ${keyword} por user ${userId} usando Anthropic`);
            
            // @ts-ignore
            const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
            if (!ANTHROPIC_API_KEY) {
                console.error('ERRO CRÍTICO: ANTHROPIC_API_KEY não configurada.');
                throw new Error('ANTHROPIC_API_KEY não configurada como secret.');
            }
            
            const advancedPrompt = createAdvancedPrompt(keyword, context, audience, type);
            
            const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20240620', // Modelo poderoso para escrita
                    max_tokens: 4096,
                    messages: [
                        { role: "user", content: advancedPrompt }
                    ],
                    // Claude não tem response_format nativo, mas é excelente em seguir instruções JSON
                }),
            });

            if (!anthropicResponse.ok) {
                const errorBody = await anthropicResponse.json();
                console.error("Anthropic API Error Body:", errorBody);
                // Lançar erro mais detalhado
                throw new Error(`Falha na API do Anthropic: ${errorBody.error?.message || anthropicResponse.statusText}`);
            }
            
            const anthropicData = await anthropicResponse.json();
            const rawContent = anthropicData.content[0].text;
            
            // Tenta extrair o JSON do bloco de código (comum no Claude)
            const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : rawContent;
            
            let generatedContent;
            try {
                generatedContent = JSON.parse(jsonString);
            } catch (e) {
                console.error("Failed to parse AI JSON output:", jsonString);
                throw new Error("A IA não retornou um JSON válido. Tente novamente.");
            }
            
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
            
            return new Response(JSON.stringify({ success: true, draftId: draft.id, status: 'draft_created' }), {
              headers: corsHeaders,
              status: 200, 
            })
        }
        
        // --- AÇÃO: REANÁLISE DE SEO (USANDO OPENAI) ---
        if (action === 'reanalyze') {
            const { draft } = body;
            
            if (!draft || !draft.content || !draft.keyword) {
                return new Response(JSON.stringify({ error: 'Bad Request: Dados do rascunho incompletos para reanálise.' }), { status: 400, headers: corsHeaders })
            }
            
            // @ts-ignore
            const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
            if (!OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY não configurada como secret.');
            }
            
            const reanalyzePrompt = createReanalyzePrompt(draft);
            
            const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: "system", content: "Você é um assistente de SEO. Sua saída deve ser APENAS um objeto JSON válido, seguindo o formato estrito fornecido pelo usuário." },
                        { role: "user", content: reanalyzePrompt }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.1, // Baixa temperatura para análise
                }),
            });

            if (!aiResponse.ok) {
                const errorBody = await aiResponse.json();
                console.error("OpenAI API Error (Reanalyze):", errorBody);
                throw new Error(`Falha na API do OpenAI (Reanálise): ${errorBody.error?.message || aiResponse.statusText}`);
            }
            
            const aiData = await aiResponse.json();
            const rawContent = aiData.choices[0].message.content;
            
            let reanalyzeResult;
            try {
                reanalyzeResult = JSON.parse(rawContent);
            } catch (e) {
                console.error("Failed to parse AI JSON output (Reanalyze):", rawContent);
                throw new Error("A IA não retornou um JSON válido na reanálise.");
            }
            
            // Retorna o novo score e sugestões
            return new Response(JSON.stringify({ success: true, data: reanalyzeResult }), {
              headers: corsHeaders,
              status: 200, 
            })
        }
        
        // Se a ação não for reconhecida
        return new Response(JSON.stringify({ error: 'Bad Request: Ação não reconhecida' }), { status: 400, headers: corsHeaders })
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