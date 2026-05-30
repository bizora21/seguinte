// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// ============================================================================
// Google Merchant Center — Product Feed (RSS 2.0 + Google Shopping namespace)
//
// URL pública: https://<project>.supabase.co/functions/v1/google-merchant-feed
//
// Especificações cobertas:
//   - País: MZ (Moçambique)
//   - Moeda: MZN
//   - Idioma: pt-PT
//   - Condição: new (todos os produtos da plataforma)
//   - Disponibilidade: in_stock (filtro WHERE stock > 0)
//   - Brand: nome da loja do vendedor
//
// Sem autenticação — endpoint público para o crawler do Google Merchant.
// Cache HTTP de 1h (Google fetcha tipicamente cada 24h).
// ============================================================================

const SITE_URL = 'https://lojarapidamz.com'

// Mapeamento dos slugs internos para IDs da taxonomia Google Product Categories.
// Referência: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
const GOOGLE_CATEGORY_ID: Record<string, string> = {
  eletronicos:      '222',   // Electronics
  moda:             '1604',  // Apparel & Accessories
  'casa-e-jardim':  '536',   // Home & Garden
  esportes:         '988',   // Sporting Goods
  livros:           '783',   // Media > Books
  acessorios:       '167',   // Apparel & Accessories > Clothing Accessories
  moveis:           '436',   // Home & Garden > Furniture
  alimentos:        '412',   // Food, Beverages & Tobacco
  beleza:           '469',   // Health & Beauty
  saude:            '491',   // Health & Beauty > Health Care
  automotivo:       '888',   // Vehicles & Parts
  outros:           '632',   // Hardware (fallback genérico)
}
const FALLBACK_CATEGORY_ID = '632'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---- Helpers --------------------------------------------------------------

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/[<>&"']/g, (c) => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
    }[c] as string))
    // Converte qualquer char não-ASCII (acentos, em-dash, etc.) em entidades
    // numéricas. Output 100% ASCII → impossível de ser mal interpretado por
    // viewers Latin-1/Windows-1252. Parsers XML decodificam para Unicode.
    .replace(new RegExp('[\u0080-\uFFFF]', 'g'), (c) => `&#${c.charCodeAt(0)};`)
}

function stripHtml(html: string | null | undefined): string {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// products.image_url pode ser uma string única OU um JSON array stringificado.
function getFirstImage(imageUrl: string | null | undefined): string {
  if (!imageUrl) return ''
  try {
    const parsed = JSON.parse(imageUrl)
    if (Array.isArray(parsed)) return parsed[0] || ''
  } catch { /* não era JSON — assume string única */ }
  return imageUrl
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}

// ---- Handler --------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, name, description, price, image_url, stock, category,
        seller:profiles!products_seller_id_fkey ( store_name )
      `)
      .gt('stock', 0)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('google-merchant-feed: query failed', error)
      return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
    }

    const items = (products || [])
      .map((p: any) => {
        const imageUrl = getFirstImage(p.image_url)
        if (!imageUrl) return ''  // Google exige image_link válido — produtos sem imagem são saltados

        const title = truncate(String(p.name || '').trim(), 150)
        const description = truncate(stripHtml(p.description) || title, 5000)
        const brand = (p.seller?.store_name || 'LojaRápida').toString().trim()
        const googleCategory = GOOGLE_CATEGORY_ID[p.category] || FALLBACK_CATEGORY_ID
        const priceFormatted = Number(p.price).toFixed(2)

        return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${SITE_URL}/produto/${escapeXml(p.id)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${priceFormatted} MZN</g:price>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:google_product_category>${googleCategory}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`
      })
      .filter(Boolean)
      .join('\n')

    // Texto estatico do canal tambem passa por escapeXml -> entidades numericas
    // (garante 100% ASCII no output, imune a problemas de encoding em viewers).
    const channelTitle = escapeXml('LojaRápida — Catálogo de Produtos')
    const channelDesc = escapeXml(
      'Catálogo de produtos disponíveis na LojaRápida — marketplace de Moçambique com pagamento na entrega.'
    )

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${channelTitle}</title>
    <link>${SITE_URL}</link>
    <description>${channelDesc}</description>
    <language>pt-PT</language>
${items}
  </channel>
</rss>`

    // IMPORTANTE: encode explícito para Uint8Array.
    // Passar string directamente ao Response causa double-encoding em algumas
    // edge regions (UTF-8 reinterpretado como Latin-1). Bytes pré-encoded
    // eliminam essa ambiguidade.
    const body = new TextEncoder().encode(xml)

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1h
      },
    })
  } catch (err) {
    console.error('google-merchant-feed: unexpected error', err)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})
