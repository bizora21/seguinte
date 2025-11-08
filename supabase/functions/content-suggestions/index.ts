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
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Autenticação do Usuário
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  
  const token = authHeader.replace('Bearer ', '')
  // @ts-ignore
  const supabaseAnon = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)

  if (authError || !user) {
    console.error('Authentication failed:', authError?.message)
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: corsHeaders })
  }

  try {
    const { keyword, contentType } = await req.json()
    
    if (!keyword) {
      return new Response(JSON.stringify({ error: 'Keyword is required' }), { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured as secret.')
    }

    const prompt = `Forneça 5 sugestões de palavras-chave LSI (Latent Semantic Indexing) para o artigo sobre "${keyword}" no contexto de "${contentType || 'blog'}". As sugestões devem ser curtas e relevantes. Retorne APENAS um objeto JSON com uma chave "suggestions" contendo uma lista de strings.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: "Você é um assistente de SEO. Sua saída deve ser APENAS um objeto JSON válido com uma chave 'suggestions', sem texto adicional." },
            { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.json()
      console.error("OpenAI API Error:", errorBody)
      throw new Error(`Failed to fetch suggestions: ${errorBody.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    let suggestions: string[] = []
    try {
        const rawContent = data.choices[0].message.content
        const parsed = JSON.parse(rawContent)
        // CORREÇÃO: Acessar a chave 'suggestions' dentro do objeto JSON
        if (parsed && Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions.filter((s: any) => typeof s === 'string')
        }
    } catch (e) {
        console.error("Failed to parse AI JSON output:", e)
        suggestions = []
    }

    return new Response(JSON.stringify({ suggestions }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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