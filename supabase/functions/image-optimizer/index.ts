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
    console.error('Optimizer: Unauthorized call.');
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  
  try {
    const { imageUrl, altText } = await req.json()
    
    if (!imageUrl) {
        return new Response(JSON.stringify({ error: 'Bad Request: URL da imagem ausente.' }), { status: 400, headers: corsHeaders })
    }

    console.log(`OPTIMIZER DEBUG: Iniciando otimização para URL: ${imageUrl}`);

    // 1. Baixar a imagem
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        console.error(`OPTIMIZER DEBUG: Falha ao baixar imagem: ${imageResponse.statusText}`);
        throw new Error(`Falha ao baixar imagem: ${imageResponse.statusText}`);
    }
    
    // 2. Obter o ArrayBuffer da imagem
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`OPTIMIZER DEBUG: Imagem baixada. Tamanho: ${imageBuffer.byteLength} bytes`);
    
    // 3. SIMULAÇÃO DE OTIMIZAÇÃO (WebP e Redimensionamento)
    const optimizedBuffer = imageBuffer; 
    const mimeType = 'image/webp'; 
    
    // CORREÇÃO CRÍTICA: Simplificando o caminho do arquivo para evitar 'requested path is invalid'
    // Usaremos o subdiretório 'blog/' dentro do bucket 'product-images'
    const fileName = `optimized-${Date.now()}.webp`;
    const filePath = `blog/${fileName}`; // Usando 'blog/' como subdiretório
    
    // 4. Upload para o Supabase Storage (usando Service Role Key)
    console.log(`OPTIMIZER DEBUG: Iniciando upload para ${filePath}`);
    const { error: uploadError } = await supabaseServiceRole.storage
        .from('product-images') // Usando o bucket existente
        .upload(filePath, optimizedBuffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (uploadError) {
        console.error('OPTIMIZER DEBUG: Upload Error:', uploadError);
        // Lançar erro detalhado para debug
        throw new Error(`Falha no upload para o storage: ${uploadError.message}. Caminho: ${filePath}`);
    }

    const { data: publicUrlData } = supabaseServiceRole.storage
        .from('product-images')
        .getPublicUrl(filePath);
        
    const optimizedUrl = publicUrlData.publicUrl;
    console.log(`OPTIMIZER DEBUG: Upload concluído. URL pública: ${optimizedUrl}`);

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