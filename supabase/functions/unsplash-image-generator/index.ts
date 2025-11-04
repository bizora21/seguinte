// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Função auxiliar para traduzir texto usando OpenAI
// @ts-ignore
async function translateToPortuguese(text: string): Promise<string> {
    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY não configurada. Retornando texto original.');
        return text;
    }
    
    try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: "system", content: "Você é um tradutor profissional. Traduza o texto fornecido para o português de Moçambique. Retorne APENAS a tradução." },
                    { role: "user", content: `Traduza para o português: "${text}"` }
                ],
                temperature: 0.1,
            }),
        });

        if (!aiResponse.ok) {
            console.error("OpenAI Translation API Error:", aiResponse.statusText);
            return text;
        }
        
        const aiData = await aiResponse.json();
        const translatedText = aiData.choices[0].message.content.trim().replace(/^"|"$/g, ''); // Remove aspas
        return translatedText;
        
    } catch (e) {
        console.error("Translation failed:", e);
        return text;
    }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { method } = req
    
    if (method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders })
    }
    
    const { prompt } = await req.json()
    
    if (!prompt) {
        return new Response(JSON.stringify({ success: false, error: 'Prompt de busca ausente.' }), { status: 400, headers: corsHeaders })
    }

    // 1. Obter a chave de acesso do Unsplash
    // @ts-ignore
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!UNSPLASH_ACCESS_KEY) {
        throw new Error('UNSPLASH_ACCESS_KEY não configurada como secret.');
    }
    
    // 2. Construir a URL de busca do Unsplash
    const query = encodeURIComponent(`${prompt} moçambique e-commerce`); // Adicionando contexto local
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

    // 3. Fazer a requisição
    const unsplashResponse = await fetch(unsplashUrl, {
        headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
    });

    if (!unsplashResponse.ok) {
        const errorBody = await unsplashResponse.json();
        console.error("Unsplash API Error:", errorBody);
        throw new Error(`Falha na API do Unsplash: ${unsplashResponse.statusText}`);
    }
    
    const unsplashData = await unsplashResponse.json();
    
    if (unsplashData.results.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Nenhuma imagem encontrada para o prompt.' }), {
            headers: corsHeaders,
            status: 404,
        });
    }
    
    const imageResult = unsplashData.results[0];
    
    // Usar a URL de tamanho regular
    const imageUrl = imageResult.urls.regular;
    const rawAlt = imageResult.alt_description || prompt;
    
    // 4. Traduzir o Alt Text para o português
    const translatedAlt = await translateToPortuguese(rawAlt);

    return new Response(JSON.stringify({ 
        success: true, 
        imageUrl: imageUrl,
        imageAlt: translatedAlt // Retorna o texto traduzido
    }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})