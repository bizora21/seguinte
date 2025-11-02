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

const OPENAI_TEXT_API_URL = 'https://api.openai.com/v1/chat/completions'
// @ts-ignore
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

// Função auxiliar para chamar a API da OpenAI
// @ts-ignore
async function callOpenAITextApi(prompt: string, model: string = 'gpt-4o-mini') {
    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY não configurada nos secrets.");
    }
    
    const response = await fetch(OPENAI_TEXT_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2048,
            temperature: 0.5,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Falha na API da OpenAI (Texto): ${response.status} - ${errorBody.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    
    try {
        return JSON.parse(rawText);
    } catch (e) {
        console.error("Erro ao parsear JSON da OpenAI:", e);
        throw new Error("A OpenAI não retornou o JSON estruturado corretamente.");
    }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Autenticação (Admin apenas)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error("DEBUG: Authorization header missing in seo-coach.");
    return new Response(JSON.stringify({ error: 'Unauthorized: Authorization header missing.' }), { status: 401, headers: corsHeaders })
  }
  
  try {
    const { keyword, content } = await req.json()
    
    if (!keyword || !content) {
        console.error("DEBUG: Keyword or content missing in seo-coach payload.");
        return new Response(JSON.stringify({ error: 'Dados de entrada incompletos' }), { status: 400, headers: corsHeaders })
    }
    
    // 2. Verificar autenticação do usuário (opcional, mas bom para debug)
    const token = authHeader.replace('Bearer ', '');
    const { error: userError } = await supabase.auth.getUser(token);
    if (userError) {
        console.error("DEBUG: Invalid token in seo-coach.", userError);
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token.' }), { status: 401, headers: corsHeaders })
    }
    
    const promptSeoCoach = `
Analise este artigo para SEO com base na palavra-chave '${keyword}'. Não reescreva o texto. Apenas dê 3 sugestões curtas e acionáveis para melhorar o ranking.

Formato de Saída: Retorne um objeto JSON com uma chave 'suggestions', que é um array de objetos, cada um com 'id' (número) e 'suggestion' (string).

Exemplo de formato de saída:
{
  "suggestions": [
    { "id": 1, "suggestion": "Adicione a palavra-chave no subtítulo H2." },
    { "id": 2, "suggestion": "A meta descrição tem 165 caracteres, reduza para menos de 160." },
    { "id": 3, "suggestion": "Considere adicionar um link interno para um artigo sobre 'temas relacionados'." }
  ]
}

Artigo para análise:
---
${content}
---
`
    
    const seoSuggestions = await callOpenAITextApi(promptSeoCoach);
    
    return new Response(JSON.stringify({ data: seoSuggestions }), {
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    console.error('Edge Function Error (Catch Block):', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})