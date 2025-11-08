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
  { auth: { persistSession: false } }
)

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
    
    const { prompt } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ success: false, error: 'Prompt de busca ausente.' }), { status: 400, headers: corsHeaders });

    // @ts-ignore
    const GEMINI_API_KEY = Deno.env.get('GLM_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GLM_API_KEY (Gemini API Key) não configurada como secret.');
    
    // Esta é uma simulação de chamada para uma API de geração de imagem.
    // A API real do Gemini para imagens pode ser mais complexa (ex: Vertex AI).
    // Para este exemplo, vamos usar uma API hipotética que retorna a imagem diretamente.
    // Em um cenário real, você usaria o SDK do Google ou uma chamada REST para o modelo de imagem (ex: Imagen).
    
    // Simulação: Vamos usar o Unsplash como um fallback para ter uma imagem funcional.
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&per_page=1&orientation=landscape`;
    // @ts-ignore
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY não configurada como secret para o fallback.');

    const imageApiResponse = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    if (!imageApiResponse.ok) throw new Error(`Falha na API de imagem: ${imageApiResponse.statusText}`);
    
    const imageData = await imageApiResponse.json();
    if (imageData.results.length === 0) return new Response(JSON.stringify({ success: false, error: 'Nenhuma imagem encontrada para o prompt.' }), { status: 404, headers: corsHeaders });
    
    const imageResult = imageData.results[0];
    const imageUrl = imageResult.urls.regular;
    const altText = imageResult.alt_description || prompt;

    // Baixar a imagem para fazer upload no Supabase Storage
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Falha ao baixar a imagem: ${imageResponse.statusText}`);
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const fileExt = contentType.split('/')[1] || 'jpg';
    const fileName = `gemini-generated-${Date.now()}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;
    const bucket = 'product-images';
    
    const { error: uploadError } = await supabaseServiceRole.storage
        .from(bucket)
        .upload(filePath, imageBuffer, {
            contentType: contentType,
            upsert: true,
        });

    if (uploadError) throw new Error(`Falha no upload para o storage: ${uploadError.message}.`);

    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const finalImageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    
    return new Response(JSON.stringify({ 
        success: true, 
        imageUrl: finalImageUrl,
        imageAlt: altText 
    }), { headers: corsHeaders, status: 200 });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 });
  }
});