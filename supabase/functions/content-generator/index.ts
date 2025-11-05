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

// --- PROMPT AVANÇADO PARA O GLM-4.6 ---
const createAdvancedPrompt = (keyword: string, serpAnalysis: any) => {
  const ctx = serpAnalysis?.context || 'Moçambique';
  const aud = serpAnalysis?.audience || 'empreendedores';
  const contentType = serpAnalysis?.contentType || 'Guia Completo';

  return `
Você é um jornalista moçambicano de elite, especialista em SEO de alto nível e Growth Hacking. Sua missão é criar um artigo de blog exclusivo e de alta qualidade para a LojaRápida.

**TEMA PRINCIPAL:** "${contentType}" sobre a palavra-chave: "${keyword}"
**CONTEXTO LOCAL:** "${ctx}"
**PÚBLICO-ALVO:** "${aud}"

**ANÁLISE DE SERP FORNECIDA:**
${serpAnalysis ? JSON.stringify(serpAnalysis, null, 2) : 'Nenhuma análise fornecida.'}

**REGRAS ESTRITAS DE GERAÇÃO E ESTRUTURA (CRÍTICO PARA SEO E QUALIDADE HUMANA):**
1.  **QUALIDADE HUMANA:** O artigo deve ter um tom envolvente, natural e parecer escrito por um especialista humano moçambicano. Evite frases clichês de IA.
2.  **ESTRUTURA JSON (TipTap):** O conteúdo do campo \`content\` DEVE ser um objeto JSON no formato TipTap/ProseMirror.
3.  **BLOCOS OBRIGATÓRIOS:** Inclua headings (H1, H2, H3), parágrafos, e listas.
4.  **SEO AVANÇADO:** Use a palavra-chave principal e secundárias de forma natural nos blocos de texto.
5.  **LINKS E CTA:** Inclua 1-3 links externos e um CTA final no formato de bloco CTA.
6.  **IMAGEM PROFISSIONAL:** Gere um \`image_prompt\` detalhado em inglês para uma imagem de alta qualidade, estilo fotográfico profissional, otimizada para Google Discover (16:9).
7.  **MÉTRICAS:** Gere \`seo_score\` (70-100) e \`readability_score\` (Ex: "Excelente", "Bom").

**FORMATO DE SAÍDA OBRIGATÓRIO:**
Retorne APENAS um objeto JSON estruturado exatamente como abaixo.

\`\`\`json
{
  "title": "O título H1 do artigo aqui",
  "slug": "o-slug-do-artigo-aqui",
  "meta_description": "A meta descrição (até 160 caracteres) aqui, focada em valor e sem clichês.",
  "content": {
    "type": "doc",
    "content": [
      { "type": "heading", "attrs": {"level": 1}, "content": [{ "type": "text", "text": "Título Principal do Artigo" }] },
      { "type": "paragraph", "content": [{ "type": "text", "text": "O primeiro parágrafo do artigo começa aqui, com um gancho forte e envolvente." }] },
      { "type": "heading", "attrs": {"level": 2}, "content": [{ "type": "text", "text": "Título da Primeira Seção" }] },
      { "type": "paragraph", "content": [{ "type": "text", "text": "Conteúdo detalhado da seção." }] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Item de lista 1" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Item de lista 2" }] }] }
      ]}
    ]
  },
  "image_prompt": "A detailed prompt in English for a high-quality, professional photograph-style image relevant to the article's theme.",
  "secondary_keywords": ["palavra-chave-adicional-1", "palavra-chave-adicional-2"],
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
    // Converte o conteúdo JSON do TipTap para texto simples para análise de SEO
    const contentText = JSON.stringify(draft.content).replace(/\{"type":"text","text":"(.*?)"\}/g, '$1').replace(/[^a-zA-Z0-9\s]/g, ' ');

    return `
Você é um especialista em SEO e Growth Hacking. Sua tarefa é analisar o conteúdo de texto fornecido abaixo e fornecer uma reavaliação do SEO Score e Readability Score.

**Palavra-chave Principal:** ${draft.keyword}
**Conteúdo Atual (Texto Simples):**
---
${contentText.substring(0, 4000)}
---

**REGRAS ESTRITAS DE REANÁLISE:**
1.  **Foco:** Avalie a densidade da palavra-chave, a estrutura de títulos (H2, H3), a profundidade do conteúdo e a clareza da escrita.
2.  **Métricas:** Gere um novo \`seo_score\` (70-100) e \`readability_score\` (Ex: "Excelente", "Bom", "Mediano").
3.  **SAÍDA:** Retorne APENAS um objeto JSON estruturado exatamente como abaixo.

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


// --- FUNÇÃO PRINCIPAL DA EDGE FUNCTION ---
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

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    console.error('Authentication failed:', authError?.message)
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: corsHeaders })
  }

  const userId = user.id

  try {
    if (req.method === 'POST') {
      const body = await req.json()
      const { action, keyword, model, context, audience, type, serpAnalysis, draftId } = body

      // @ts-ignore
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY não configurada como secret.')
      }

      // --- AÇÃO: GERAR CONTEÚDO INICIAL (USANDO GLM-4.6) ---
      if (action === 'generate') {
        if (!keyword) {
          return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
        }

        console.log(`DEBUG: Iniciando geração de conteúdo para: ${keyword} por user ${userId} usando GLM-4.6`);

        const advancedPrompt = createAdvancedPrompt(keyword, serpAnalysis)

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o', // Usando o modelo mais poderoso
            max_tokens: 4096,
            messages: [
              { role: 'system', content: 'Você é um assistente que retorna apenas JSON válido. Sua saída deve ser um objeto JSON estruturado, sem texto adicional.' },
              { role: 'user', content: advancedPrompt }
            ],
            response_format: { type: 'json_object' }, // CRUCIAL para JSON mode
            temperature: 0.7, // Temperatura mais alta para criatividade
          }),
        })

        if (!openaiResponse.ok) {
          const errorBody = await openaiResponse.json()
          console.error("OpenAI API Error Body (Generate):", errorBody)
          throw new Error(`Falha na API do OpenAI (Geração): ${errorBody.error?.message || openaiResponse.statusText}`)
        }

        const openaiData = await openaiResponse.json()
        const rawContent = openaiData.choices[0].message.content

        let generatedContent
        try {
          generatedContent = JSON.parse(rawContent)
        } catch (e) {
          console.error("Failed to parse AI JSON output (Generate):", rawContent)
          throw new Error("A IA não retornou um JSON válido. Tente novamente.")
        }

        // Validação básica do conteúdo gerado
        if (!generatedContent.title || !generatedContent.content || typeof generatedContent.content !== 'object') {
          throw new Error('O conteúdo gerado pela IA está em um formato inválido.')
        }

        // Inserir o rascunho no banco de dados
        const { data: draft, error: insertError } = await supabaseServiceRole
          .from('content_drafts')
          .insert({
            user_id: userId,
            keyword: keyword,
            model: model || 'gpt-4o',
            status: 'draft',
            title: generatedContent.title,
            slug: generatedContent.slug,
            meta_description: generatedContent.meta_description,
            content: JSON.stringify(generatedContent.content), // Armazenar como string JSON
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
          console.error("DEBUG: FALHA NA INSERÇÃO DO RASCUNHO:", insertError)
          return new Response(JSON.stringify({ error: `Falha ao criar rascunho: ${insertError.message}` }), { status: 500, headers: corsHeaders })
        }

        console.log(`DEBUG: RASCUNHO CRIADO COM SUCESSO! ID: ${draft.id}`);
        return new Response(JSON.stringify({ success: true, draftId: draft.id, status: 'draft_created' }), {
          headers: corsHeaders,
          status: 200,
        })
      }

      // --- AÇÃO: REANÁLISE DE SEO (USANDO GLM-4.6) ---
      if (action === 'reanalyze') {
        const { draft } = body;
        
        if (!draft || !draft.content || !draft.keyword) {
            return new Response(JSON.stringify({ error: 'Bad Request: Dados do rascunho incompletos para reanálise.' }), { status: 400, headers: corsHeaders })
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