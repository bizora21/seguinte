// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Inicializa o cliente Supabase (para interagir com o banco de dados)
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
                    { role: "system", content: "Você é um tradutor profissional. Sua saída deve ser APENAS a tradução do texto fornecido para o português de Moçambique." },
                    { role: "user", content: `Traduza para o português: "${text}"` }
                ],
                temperature: 0.1,
            }),
        });

        if (!aiResponse.ok) {
            console.error("OpenAI Translation API Error:", aiResponse.statusText);
            // Tenta ler o corpo do erro para mais detalhes
            const errorBody = await aiResponse.json();
            console.error("OpenAI Translation Error Body:", errorBody);
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
        console.error('ERRO CRÍTICO: UNSPLASH_ACCESS_KEY não configurada.');
        throw new Error('UNSPLASH_ACCESS_KEY não configurada como secret.');
    }
    
    // 2. Construir a URL de busca do Unsplash
    const query = encodeURIComponent(`${prompt} moçambique e-commerce`); // Adicionando contexto local
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;
    console.log(`DEBUG: Buscando no Unsplash com query: ${query}`);

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
        console.warn('Nenhuma imagem encontrada para o prompt.');
        return new Response(JSON.stringify({ success: false, error: 'Nenhuma imagem encontrada para o prompt.' }), {
            headers: corsHeaders,
            status: 404,
        });
    }
    
    const imageResult = unsplashData.results[0];
    
    // Usar a URL de tamanho regular
    const rawImageUrl = imageResult.urls.regular;
    const rawAlt = imageResult.alt_description || prompt;
    
    console.log(`DEBUG: Imagem encontrada. URL: ${rawImageUrl}`);

    // 4. Traduzir o Alt Text para o português
    const translatedAlt = await translateToPortuguese(rawAlt);
    console.log(`DEBUG: Alt Text traduzido: ${translatedAlt}`);
    
    // 5. Chamar a Edge Function de Otimização para processar a imagem
    // A URL da Edge Function é construída dinamicamente
    const optimizerUrl = `${req.url.replace('unsplash-image-generator', 'image-optimizer')}`;
    console.log(`DEBUG: Chamando Optimizer em: ${optimizerUrl}`);
    
    const optimizeResponse = await fetch(optimizerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Reutiliza o token de autenticação do cliente para a chamada interna
            'Authorization': req.headers.get('Authorization') || '', 
        },
        body: JSON.stringify({
            imageUrl: rawImageUrl,
            altText: translatedAlt,
        }),
    });
    
    if (!optimizeResponse.ok) {
        const errorBody = await optimizeResponse.json();
        console.error("Optimizer API Error:", errorBody);
        throw new Error(`Falha na otimização da imagem: ${errorBody.error || optimizeResponse.statusText}`);
    }
    
    const optimizedData = await optimizeResponse.json();
    console.log(`DEBUG: Otimização concluída. URL final: ${optimizedData.optimizedUrl}`);

    return new Response(JSON.stringify({ 
        success: true, 
        imageUrl: optimizedData.optimizedUrl, // URL do Supabase Storage
        imageAlt: translatedAlt 
    }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error (Catch Block):', error)
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})