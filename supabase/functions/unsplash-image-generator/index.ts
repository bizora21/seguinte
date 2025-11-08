// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { toByteArray } from 'https://deno.land/std@0.190.0/encoding/base64.ts'

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
  { auth: { persistSession: false } }
)

// @ts-ignore
async function translateToPortuguese(text: string): Promise<string> {
    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) return text;
    try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: "system", content: "Você é um tradutor profissional. Sua saída deve ser APENAS a tradução do texto fornecido para o português de Moçambique." },
                    { role: "user", content: `Traduza para o português: "${text}"` }
                ],
                temperature: 0.1,
            }),
        });
        if (!aiResponse.ok) return text;
        const aiData = await aiResponse.json();
        return aiData.choices[0].message.content.trim().replace(/^"|"$/g, '');
    } catch (e) {
        console.error("Translation failed:", e);
        return text;
    }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
    
    const { prompt } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ success: false, error: 'Prompt de busca ausente.' }), { status: 400, headers: corsHeaders });

    // @ts-ignore
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY não configurada como secret.');
    
    const query = encodeURIComponent(`${prompt} moçambique e-commerce`);
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

    const unsplashResponse = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    if (!unsplashResponse.ok) throw new Error(`Falha na API do Unsplash: ${unsplashResponse.statusText}`);
    
    const unsplashData = await unsplashResponse.json();
    if (unsplashData.results.length === 0) return new Response(JSON.stringify({ success: false, error: 'Nenhuma imagem encontrada para o prompt.' }), { status: 404, headers: corsHeaders });
    
    const imageResult = unsplashData.results[0];
    const imageUrl = imageResult.urls.regular;
    const rawAlt = imageResult.alt_description || prompt;
    const translatedAlt = await translateToPortuguese(rawAlt);

    // **NOVA ETAPA: BAIXAR A IMAGEM AQUI**
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Falha ao baixar a imagem do Unsplash: ${imageResponse.statusText}`);
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Invocar a função 'image-optimizer' com os dados da imagem, não a URL
    const { data: optimizerData, error: optimizerError } = await supabaseServiceRole.functions.invoke('image-optimizer', {
        method: 'POST',
        body: {
            imageBuffer: Array.from(new Uint8Array(imageBuffer)), // Enviar como array de bytes
            contentType: contentType,
            altText: translatedAlt,
        }
    });

    if (optimizerError) throw new Error(`Falha na função de otimização de imagem: ${optimizerError.message}`);
    if (!optimizerData.success) throw new Error(`Erro na otimização da imagem: ${optimizerData.error}`);
    
    return new Response(JSON.stringify({ 
        success: true, 
        imageUrl: optimizerData.optimizedUrl,
        imageAlt: optimizerData.altText 
    }), { headers: corsHeaders, status: 200 });

  } catch (error) {
    console.error('Edge Function Error (Catch Block):', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 });
  }
});