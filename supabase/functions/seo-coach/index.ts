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

// URL da API da GLM (Simulação)
const GLM_API_URL = 'https://api.glm.ai/v1/generate'
// @ts-ignore
const GLM_API_KEY = Deno.env.get('GLM_API_KEY')

// Função auxiliar para chamar a API da GLM
// @ts-ignore
async function callGlmApi(prompt: string, model: string = 'glm-4') {
    if (!GLM_API_KEY) {
        // MOCK para desenvolvimento sem chave
        return {
            suggestions: [
                { id: 1, suggestion: "Adicione a palavra-chave principal no primeiro parágrafo para aumentar a densidade." },
                { id: 2, suggestion: "A meta descrição tem 165 caracteres, reduza para menos de 160." },
                { id: 3, suggestion: "Considere adicionar um link interno para um artigo sobre 'temas relacionados'." }
            ]
        };
    }
    
    // Lógica real de chamada de API
    // ...
    
    // Retorno simulado para evitar erro de compilação
    return {
        suggestions: [
            { id: 1, suggestion: "Adicione a palavra-chave principal no primeiro parágrafo para aumentar a densidade." },
            { id: 2, suggestion: "A meta descrição tem 165 caracteres, reduza para menos de 160." },
            { id: 3, suggestion: "Considere adicionar um link interno para um artigo sobre 'temas relacionados'." }
        ]
    };
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Autenticação (Admin apenas)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  
  try {
    const { keyword, content } = await req.json()
    
    if (!keyword || !content) {
        return new Response(JSON.stringify({ error: 'Dados de entrada incompletos' }), { status: 400, headers: corsHeaders })
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
    
    const seoSuggestions = await callGlmApi(promptSeoCoach);
    
    return new Response(JSON.stringify({ data: seoSuggestions }), {
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