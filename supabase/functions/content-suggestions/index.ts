// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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

    // Prompt otimizado para sugestões
    const prompt = `Forneça 5 sugestões de palavras-chave LSI (Latent Semantic Indexing) para o artigo sobre "${keyword}" no contexto de "${contentType || 'blog'}". As sugestões devem ser curtas e relevantes. Retorne APENAS uma lista JSON de strings.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: "Você é um assistente de SEO. Sua saída deve ser APENAS um array JSON de strings, sem texto adicional." },
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
        if (Array.isArray(parsed)) {
            suggestions = parsed.filter(s => typeof s === 'string')
        }
    } catch (e) {
        console.error("Failed to parse AI JSON output:", e)
        // Fallback para tentar extrair linhas se o JSON falhar
        suggestions = data.choices[0].message.content.split('\n').map(s => s.trim()).filter(s => s.length > 0)
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