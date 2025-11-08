// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
    
    const { prompt } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ success: false, error: 'Prompt de busca ausente.' }), { status: 400, headers: corsHeaders });

    // A chave da API do Gemini não é mais necessária aqui, pois estamos usando Unsplash como fonte de imagem.
    // Vamos usar a chave do Unsplash diretamente.
    // @ts-ignore
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY não configurada como secret.');
    
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&per_page=1&orientation=landscape`;

    const imageApiResponse = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    if (!imageApiResponse.ok) throw new Error(`Falha na API de imagem (Unsplash): ${imageApiResponse.statusText}`);
    
    const imageData = await imageApiResponse.json();
    if (!imageData.results || imageData.results.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Nenhuma imagem encontrada para o prompt.' }), { status: 404, headers: corsHeaders });
    }
    
    const imageResult = imageData.results[0];
    const imageUrl = imageResult.urls.regular;
    const altText = imageResult.alt_description || prompt;

    // Retorna diretamente a URL do Unsplash, sem fazer download/upload.
    return new Response(JSON.stringify({ 
        success: true, 
        imageUrl: imageUrl,
        imageAlt: altText 
    }), { headers: corsHeaders, status: 200 });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 });
  }
});