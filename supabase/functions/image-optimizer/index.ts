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

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error('Optimizer: Unauthorized call.');
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  
  try {
    const { imageUrl, altText } = await req.json()
    
    if (!imageUrl) {
        return new Response(JSON.stringify({ error: 'Bad Request: URL da imagem ausente.' }), { status: 400, headers: corsHeaders })
    }

    // 1. Baixar a imagem e obter seu tipo de conteúdo real
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error(`Falha ao baixar imagem: ${imageResponse.statusText}`);
    }
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // 2. Obter o ArrayBuffer da imagem
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // 3. Gerar um nome de arquivo com a extensão correta
    const fileExt = contentType.split('/')[1] || 'jpg';
    const fileName = `blog-${Date.now()}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;
    
    // 4. Upload para o Supabase Storage com o tipo de conteúdo correto
    const { error: uploadError } = await supabaseServiceRole.storage
        .from('product-images')
        .upload(filePath, imageBuffer, {
            contentType: contentType, // Usar o tipo de conteúdo real
            upsert: true,
        });

    if (uploadError) {
        throw new Error(`Falha no upload para o storage: ${uploadError.message}.`);
    }

    // 5. Gerar um link seguro (Signed URL) com longa duração (10 anos)
    const tenYearsInSeconds = 10 * 365 * 24 * 60 * 60;
    const { data, error: signedUrlError } = await supabaseServiceRole.storage
      .from('product-images')
      .createSignedUrl(filePath, tenYearsInSeconds);

    if (signedUrlError) {
      throw new Error(`Falha ao criar URL assinada: ${signedUrlError.message}`);
    }
        
    const optimizedUrl = data.signedUrl;

    return new Response(JSON.stringify({ 
        success: true, 
        optimizedUrl: optimizedUrl,
        altText: altText
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