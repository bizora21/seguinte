// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// ============================================================================
// Google Merchant Center -- Product Feed (RSS 2.0 + Google Shopping namespace)
//
// URL publica: https://<project>.supabase.co/functions/v1/google-merchant-feed
//
// Especificacoes cobertas:
//   - Pais: MZ (Mocambique)
//   - Moeda: MZN
//   - Idioma: pt-PT
//   - Condicao: new (todos os produtos da plataforma)
//   - Disponibilidade: in_stock (filtro WHERE stock > 0)
//   - Brand: nome da loja do vendedor (NUNCA "LojaRapida" -- marketplace)
//   - Shipping: 0 MZN (combinado entre vendedor e cliente)
//
// Sem autenticacao -- endpoint publico para o crawler do Google Merchant.
// Cache HTTP de 1h (Google fetcha tipicamente cada 24h).
// ============================================================================

const SITE_URL = 'https://lojarapidamz.com'
const BRAND_FALLBACK = 'Vendedor Parceiro'  // NUNCA usar nome do marketplace
const CUSTOM_LABEL_0 = 'marketplace_mz'      // Identifica origem dos produtos

// ---- Filtros Google Merchant ------------------------------------------------
// Produtos que falham validacao do GMC -- excluidos no map() em vez de
// retornar XML invalido.
//
// 1) Servicos/produtos digitais: GMC nao aceita no feed shopping fisico.
//    \b...\b evita falsos positivos como "camara digital" (substring).
const DIGITAL_PATTERN = /\b(pdf|megas|chamadas|investimentos?|ebooks?|download|curso\s+online|recarga|saldo|cripto|bitcoin)\b/i

// 2) Titulos genericos de uma palavra -- comparacao case-insensitive trim.
const GENERIC_TITLES = new Set([
  'comida', 'vestuario', 'vestuário', 'roupa', 'roupas',
  'conjunto', 'cabelo', 'óculos', 'oculos', 'sapatos',
])

const MIN_TITLE_LEN = 10
const MIN_DESC_LEN  = 20

// Mapeamento dos slugs internos para IDs da taxonomia Google Product Categories.
// Referencia: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
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
  outros:           '536',   // Home & Garden (catch-all neutro, NAO Hardware)
}
// Fallback = Home & Garden. Hardware (632) era pior porque a maioria dos
// produtos 'outros' sao utensilios de cozinha/casa, nao ferramentas.
const FALLBACK_CATEGORY_ID = '536'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---- Helpers --------------------------------------------------------------

// Char-a-char: percorre a string, decide o que manter/escapar/remover.
// Evita regex com escapes Unicode (que ja falharam antes -- o JSON do Write
// interpretou '' como NULL byte literal e crashou o parser Deno).
// Source 100% ASCII -- imune a problemas de encoding em qualquer tooling.
function escapeXml(value: unknown): string {
  const s = String(value == null ? '' : value)
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    const c = s[i]

    // 1) Controlos XML-invalidos (spec XML 1.0): tudo abaixo de 0x20 excepto
    //    tab (0x09), LF (0x0A), CR (0x0D). E DEL (0x7F) + C1 controls (0x80-0x9F).
    if (code < 0x20 && code !== 0x09 && code !== 0x0A && code !== 0x0D) continue
    if (code === 0x7F) continue
    if (code >= 0x80 && code <= 0x9F) continue

    // 2) Surrogates (0xD800-0xDFFF): em pares formam emojis em SMP; processados
    //    char-a-char produzem entidades invalidas. Skip o par inteiro.
    if (code >= 0xD800 && code <= 0xDBFF) { i++; continue }  // high surrogate
    if (code >= 0xDC00 && code <= 0xDFFF) continue           // low surrogate orfa

    // 3) Non-characters
    if (code === 0xFFFE || code === 0xFFFF) continue

    // 4) Pictogramas BMP (dingbats, setas decorativas, simbolos tecnicos,
    //    misc symbols+arrows, variation selectors, ZWJ).
    if (code >= 0x2300 && code <= 0x23FF) continue
    if (code >= 0x2600 && code <= 0x27BF) continue
    if (code >= 0x2B00 && code <= 0x2BFF) continue
    if (code >= 0xFE00 && code <= 0xFE0F) continue
    if (code === 0x200D) continue

    // 5) XML reserved chars
    if (c === '<')  { out += '&lt;';   continue }
    if (c === '>')  { out += '&gt;';   continue }
    if (c === '&')  { out += '&amp;';  continue }
    if (c === '"')  { out += '&quot;'; continue }
    if (c === "'")  { out += '&apos;'; continue }

    // 6) Non-ASCII -> entidade numerica (output 100% ASCII, imune a Latin-1)
    if (code >= 0x80) { out += '&#' + code + ';'; continue }

    // 7) ASCII printable: passa
    out += c
  }
  return out
}

function stripHtml(html: string | null | undefined): string {
  return String(html == null ? '' : html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// products.image_url pode ser uma string unica OU um JSON array stringificado.
function getFirstImage(imageUrl: string | null | undefined): string {
  if (!imageUrl) return ''
  try {
    const parsed = JSON.parse(imageUrl)
    if (Array.isArray(parsed)) return parsed[0] || ''
  } catch { /* nao era JSON -- assume string unica */ }
  return imageUrl
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '...'
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

    const excluded: Array<{ id: string; title: string; reason: string }> = []

    const items = (products || [])
      .map((p: any) => {
        const rawTitle = String(p.name || '').trim()
        const imageUrl = getFirstImage(p.image_url)
        if (!imageUrl) {
          excluded.push({ id: p.id, title: rawTitle, reason: 'no image_link' })
          return ''
        }

        const title = truncate(rawTitle, 150)
        const description = truncate(stripHtml(p.description) || title, 5000)
        const titleNorm = title.toLowerCase().trim()
        const descNorm = description.toLowerCase().trim()

        // FILTROS Google Merchant
        if (DIGITAL_PATTERN.test(title)) {
          excluded.push({ id: p.id, title, reason: 'digital service in title' })
          return ''
        }
        if (title.length < MIN_TITLE_LEN) {
          excluded.push({ id: p.id, title, reason: 'title too short (<' + MIN_TITLE_LEN + ' chars)' })
          return ''
        }
        if (GENERIC_TITLES.has(titleNorm)) {
          excluded.push({ id: p.id, title, reason: 'generic single-word title' })
          return ''
        }
        if (description.length < MIN_DESC_LEN) {
          excluded.push({ id: p.id, title, reason: 'description too short (<' + MIN_DESC_LEN + ' chars)' })
          return ''
        }
        if (descNorm === titleNorm) {
          excluded.push({ id: p.id, title, reason: 'description identical to title' })
          return ''
        }

        // Brand = nome da loja do vendedor. Google penaliza marketplaces que
        // usam o seu proprio nome como brand. Fallback generico se null.
        const sellerName = (p.seller?.store_name || '').toString().trim() || BRAND_FALLBACK
        const googleCategory = GOOGLE_CATEGORY_ID[p.category] || FALLBACK_CATEGORY_ID
        const priceFormatted = Number(p.price).toFixed(2)

        return '    <item>\n' +
          '      <g:id>' + escapeXml(p.id) + '</g:id>\n' +
          '      <g:title>' + escapeXml(title) + '</g:title>\n' +
          '      <g:description>' + escapeXml(description) + '</g:description>\n' +
          '      <g:link>' + SITE_URL + '/produto/' + escapeXml(p.id) + '</g:link>\n' +
          '      <g:image_link>' + escapeXml(imageUrl) + '</g:image_link>\n' +
          '      <g:availability>in_stock</g:availability>\n' +
          '      <g:price>' + priceFormatted + ' MZN</g:price>\n' +
          '      <g:condition>new</g:condition>\n' +
          '      <g:brand>' + escapeXml(sellerName) + '</g:brand>\n' +
          '      <g:seller_name>' + escapeXml(sellerName) + '</g:seller_name>\n' +
          '      <g:google_product_category>' + googleCategory + '</g:google_product_category>\n' +
          '      <g:identifier_exists>no</g:identifier_exists>\n' +
          '      <g:custom_label_0>' + CUSTOM_LABEL_0 + '</g:custom_label_0>\n' +
          '      <g:shipping>\n' +
          '        <g:country>MZ</g:country>\n' +
          '        <g:service>Combinada com vendedor</g:service>\n' +
          '        <g:price>0 MZN</g:price>\n' +
          '      </g:shipping>\n' +
          '    </item>'
      })
      .filter(Boolean)
      .join('\n')

    const totalRaw = (products || []).length
    const includedCount = totalRaw - excluded.length
    console.log('google-merchant-feed: included=' + includedCount + ' excluded=' + excluded.length + ' total=' + totalRaw)
    for (const e of excluded) {
      console.log('  EXCLUDED ' + e.id + ' | ' + e.reason + ' | ' + e.title)
    }

    // Texto estatico do canal: usa \u escapes em vez de literais acentuados.
    // O runtime do Supabase Edge le este source como Latin-1 (bug do bundler),
    // partindo cada byte UTF-8 num char separado e gerando mojibake do tipo
    // &#195;&#161; em vez de &#225; para 'a'. Os \u escapes sao interpretados
    // pelo parser JS independente do encoding do ficheiro -> sempre correctos.
    //   á = a (a-acento), ç = c-cedilha, í = i-acento,
    //   — = em-dash
    const channelTitle = escapeXml('LojaR\u00e1pida \u2014 Cat\u00e1logo de Produtos')
    const channelDesc = escapeXml(
      'Cat\u00e1logo de produtos dispon\u00edveis na LojaR\u00e1pida \u2014 marketplace de Mo\u00e7ambique com pagamento na entrega.'
    )

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' +
      '  <channel>\n' +
      '    <title>' + channelTitle + '</title>\n' +
      '    <link>' + SITE_URL + '</link>\n' +
      '    <description>' + channelDesc + '</description>\n' +
      '    <language>pt-PT</language>\n' +
      items + '\n' +
      '  </channel>\n' +
      '</rss>'

    // IMPORTANTE: encode explicito para Uint8Array.
    // Passar string directamente ao Response causa double-encoding em algumas
    // edge regions (UTF-8 reinterpretado como Latin-1). Bytes pre-encoded
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
