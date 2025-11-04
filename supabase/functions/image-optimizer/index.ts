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
  
  // Esta função é chamada internamente pelo unsplash-image-generator,
  // mas mantemos a verificação de autenticação para segurança.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  
  try {
    const { imageUrl, altText } = await req.json()
    
    if (!imageUrl) {
        return new Response(JSON.stringify({ error: 'Bad Request: URL da imagem ausente.' }), { status: 400, headers: corsHeaders })
    }

    // 1. Baixar a imagem
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error(`Falha ao baixar imagem: ${imageResponse.statusText}`);
    }
    
    // 2. Obter o ArrayBuffer da imagem
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // 3. SIMULAÇÃO DE OTIMIZAÇÃO (WebP e Redimensionamento)
    // Em um ambiente Deno real, usaríamos uma biblioteca de processamento de imagem aqui
    // para redimensionar para 1200x675 e converter para WebP.
    const optimizedBuffer = imageBuffer; // Mantemos o buffer original para a simulação
    const mimeType = 'image/webp'; // Forçamos o tipo para WebP (simulação)
    const fileName = `blog-optimized-${Date.now()}.webp`;
    const filePath = `blog-images/${fileName}`;

    // 4. Upload para o Supabase Storage (usando Service Role Key)
    const { error: uploadError } = await supabaseServiceRole.storage
        .from('product-images') // Usando o bucket existente
        .upload(filePath, optimizedBuffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw new Error(`Falha no upload para o storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseServiceRole.storage
        .from('product-images')
        .getPublicUrl(filePath);
        
    const optimizedUrl = publicUrlData.publicUrl;

    return new Response(JSON.stringify({ 
        success: true, 
        optimizedUrl: optimizedUrl,
        altText: altText
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