// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'text/html', // Retornar HTML
}

const BASE_URL = 'https://lojarapidamz.com'
const DEFAULT_IMAGE_PATH = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1200&h=630&fit=crop'

// Cliente Supabase com Service Role Key para ignorar RLS e garantir acesso aos dados
const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// @ts-ignore
const getFirstImageUrl = (imageField: string | null | undefined): string | null => {
  if (!imageField) return null;
  try {
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      // Apenas retorna a primeira URL, sem manipulação de parâmetros
      return parsed[0] as string;
    }
  } catch {
    if (typeof imageField === 'string' && imageField.trim().length > 0) {
      return imageField;
    }
  }
  return null;
};

// @ts-ignore
const cleanDescription = (description: string | undefined | null): string => {
  if (!description) return '';
  // Remove Markdown (**, #, ---, etc.) e quebras de linha excessivas
  let cleaned = description.replace(/(\*\*|__|\*|#|---|\[.*?\]\(.*?\))/g, '').replace(/\n/g, ' ').trim();
  // Reduz múltiplos espaços para um único espaço
  cleaned = cleaned.replace(/\s\s+/g, ' ');
  return cleaned;
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const url = new URL(req.url);
  const productId = url.searchParams.get('id');

  if (!productId) {
    return new Response('Product ID missing', { status: 400, headers: corsHeaders });
  }

  try {
    // 1. Buscar dados do produto e vendedor
    const { data: product, error } = await supabaseServiceRole
      .from('products')
      .select(`
        id, name, description, price, image_url,
        seller:profiles!products_seller_id_fkey(store_name)
      `)
      .eq('id', productId)
      .single();

    if (error || !product) {
      return new Response('Product not found', { status: 404, headers: corsHeaders });
    }

    const storeName = product.seller?.store_name || 'Loja Rápida';
    const productUrl = `${BASE_URL}/produto/${product.id}`;
    const priceFormatted = new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(product.price);
    
    // 2. Extrair e garantir a URL da imagem
    const seoImage = getFirstImageUrl(product.image_url);
    const absoluteImage = seoImage || DEFAULT_IMAGE_PATH; 
    
    const cleanedDescription = cleanDescription(product.description);
    const ogDescription = `${cleanedDescription.substring(0, 300) || 'Compre este produto incrível na LojaRápida. Pagamento na entrega e frete grátis em Moçambique.'}`;
    
    // Título mais descritivo para o OG
    const ogTitle = `${product.name} | ${priceFormatted} - ${storeName}`;

    // 3. Gerar o HTML mínimo com as meta tags
    const html = `
      <!DOCTYPE html>
      <html lang="pt-MZ">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${ogTitle}</title>
        
        <!-- Open Graph Tags (Facebook, WhatsApp, etc.) -->
        <meta property="og:title" content="${ogTitle}" />
        <meta property="og:description" content="${ogDescription}" />
        <meta property="og:image" content="${absoluteImage}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:url" content="${productUrl}" />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="LojaRápida" />
        
        <!-- Twitter Tags -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${ogTitle}" />
        <meta name="twitter:description" content="${ogDescription}" />
        <meta name="twitter:image" content="${absoluteImage}" />
        
        <!-- Canonical URL -->
        <link rel="canonical" href="${productUrl}" />
        
        <!-- Redirecionamento para o cliente (necessário para que o navegador carregue o app React) -->
        <meta http-equiv="refresh" content="0; url=${productUrl}">
      </head>
      <body>
        <h1>Carregando ${product.name}...</h1>
        <p>Se você não for redirecionado, clique <a href="${productUrl}">aqui</a>.</p>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
      status: 200,
    });

  } catch (error) {
    console.error('SSR Edge Function Error:', error);
    // Em caso de erro, redireciona para a página principal para que o CSR assuma
    return Response.redirect(`${BASE_URL}/produto/${productId}`, 302);
  }
});