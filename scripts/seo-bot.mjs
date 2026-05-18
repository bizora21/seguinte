/**
 * LojaRápida SEO Bot
 * Gera e publica artigos SEO automaticamente com base em produtos reais.
 *
 * Uso:
 *   node scripts/seo-bot.mjs --dry-run     (mostra keywords/produtos, não publica)
 *   node scripts/seo-bot.mjs               (publica de facto)
 *   node scripts/seo-bot.mjs --limit=5     (máximo 5 artigos)
 *
 * Variáveis de ambiente necessárias:
 *   OPENAI_API_KEY
 *   SUPABASE_URL               (opcional, já tem padrão)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// ─── Configuração ─────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bpzqdwpkwlwflrcwcrqp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

// ─── Argumentos CLI ───────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity

// ─── Seeds de busca ───────────────────────────────────────────────────────────
const SEEDS = [
  'sapatos moçambique',
  'roupas maputo',
  'cosméticos moçambique',
  'electrónica moçambique',
  'cozinha moçambique',
  'perfume moçambique',
  'acessórios maputo',
  'marketplace moçambique',
  'comprar online moçambique',
  'lojas maputo',
]

// ─── Validação de ambiente ────────────────────────────────────────────────────
if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY não definida.')
  console.error('   Passe via variável de ambiente:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seo-bot.mjs\n')
  process.exit(1)
}

if (!DRY_RUN && !OPENAI_API_KEY) {
  console.error('\n❌ OPENAI_API_KEY não definida.')
  console.error('   Passe via variável de ambiente:')
  console.error('   OPENAI_API_KEY=sk-... node scripts/seo-bot.mjs\n')
  process.exit(1)
}

// ─── Cliente Supabase ─────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Utilitários ──────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove diacríticos (ç→c, ã→a, etc.)
    .replace(/[^a-z0-9\s-]/g, '')      // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')              // espaços → hífens
    .replace(/-+/g, '-')               // múltiplos hífens → um
    .slice(0, 80)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function resolveImageUrl(raw) {
  if (!raw) return null
  if (typeof raw === 'string' && raw.trimStart().startsWith('[')) {
    try {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null
    } catch {
      return null
    }
  }
  return raw
}

// ─── MÓDULO A: Google Suggest ─────────────────────────────────────────────────
async function getKeywords(seed) {
  const variations = [
    seed,
    `${seed} moçambique`,
    `${seed} maputo`,
    `${seed} preço`,
    `onde comprar ${seed}`,
    `melhor ${seed} moçambique`,
  ]

  const all = new Set()

  for (const v of variations) {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(v)}&hl=pt`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) continue
      const data = await res.json()
      // Formato Firefox: [query, [sugestões, ...], ...]
      const suggestions = data[1] || []
      suggestions.forEach(s => all.add(s.toLowerCase().trim()))
    } catch (e) {
      // ignora timeouts e erros de rede individuais
    }
    await sleep(200)
  }

  return [...all]
}

// ─── MÓDULO B: Produtos relevantes do Supabase ───────────────────────────────
async function getProductsForKeyword(keyword) {
  // Extrai a palavra mais relevante (> 3 chars, ignora stopwords)
  const stopwords = new Set(['onde', 'como', 'para', 'mais', 'melhor', 'comprar', 'vender', 'moçambique', 'maputo', 'preço'])
  const words = keyword
    .split(/\s+/)
    .map(w => w.normalize('NFD').replace(/[̀-ͯ]/g, ''))
    .filter(w => w.length > 3 && !stopwords.has(w))

  if (words.length === 0) return []

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, price, image_url, category, description,
      seller:profiles!seller_id ( store_name, city, delivery_scope )
    `)
    .ilike('name', `%${words[0]}%`)
    .limit(6)

  if (error || !data) return []

  return data.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: resolveImageUrl(p.image_url),
    category: p.category,
    store_name: p.seller?.store_name || 'Vendedor LojaRápida',
    city: p.seller?.city || 'Moçambique',
    delivery_scope: Array.isArray(p.seller?.delivery_scope)
      ? p.seller.delivery_scope
      : [],
  }))
}

// ─── MÓDULO C: Gera artigo com GPT ───────────────────────────────────────────
async function generateArticle(keyword, products) {
  const productList = products
    .map(
      p => `
  - ${p.name}: ${p.price} MZN
    Vendedor: ${p.store_name} (${p.city})
    Entrega em: ${p.delivery_scope.length > 0 ? p.delivery_scope.join(', ') : 'Contacte o vendedor'}
    Link: https://lojarapidamz.com/produto/${p.id}
    Imagem: ${p.image_url || '(sem imagem)'}
  `
    )
    .join('\n')

  const prompt = `
Escreve um artigo SEO em português europeu sobre: "${keyword}"

Dados reais de produtos disponíveis na LojaRápida:
${productList}

Estrutura do artigo:
1. Introdução (150 palavras) - responde directamente à pergunta
2. Onde comprar em Moçambique (200 palavras) - menciona LojaRápida
3. Tabela comparativa de produtos com preços reais
4. Dicas para comprar online com segurança em Moçambique (150 palavras)
5. Conclusão com call-to-action para lojarapidamz.com

Regras obrigatórias:
- Usa dados reais (preços em MZN, nomes de lojas, cidades)
- Menciona LojaRápida de forma natural, não forçada
- Inclui imagens dos produtos com tag <img src="..." alt="..."> quando a imagem existir
- 800-1000 palavras total
- HTML formatado: usa h2, p, table, img — sem tags html/body/head/style
- Não uses as palavras: "abrangente", "mergulhar", "explorar", "navegar"
- Inclui pelo menos um link interno: <a href="https://lojarapidamz.com/produtos">ver produtos na LojaRápida</a>

Retorna JSON com exactamente estes campos:
{
  "title": "título SEO (máximo 60 caracteres)",
  "meta_description": "descrição atrativa (máximo 160 caracteres)",
  "slug": "url-amigavel-sem-acentos-palavras-separadas-por-hifens",
  "content": "HTML completo do artigo",
  "category": "categoria do artigo (ex: Moda, Electrónica, Beleza, Cozinha)",
  "secondary_keywords": ["palavra-chave-1", "palavra-chave-2", "palavra-chave-3"]
}
`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`OpenAI ${res.status}: ${err.error?.message || res.statusText}`)
  }

  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

// ─── MÓDULO D: Publica no Supabase ────────────────────────────────────────────
async function publishArticle(article, keyword, featuredImageUrl) {
  const slug = article.slug || slugify(article.title)

  // Verifica slug duplicado
  const { data: existing } = await supabase
    .from('published_articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return { skipped: true, reason: `slug "${slug}" já existe` }
  }

  // Resolve category_id pelo slug da categoria (se existir)
  let categoryId = null
  if (article.category) {
    const catSlug = slugify(article.category)
    const { data: cat } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', catSlug)
      .maybeSingle()
    categoryId = cat?.id || null
  }

  const { error } = await supabase.from('published_articles').insert({
    id: randomUUID(),
    title: article.title,
    slug,
    meta_description: article.meta_description,
    content: article.content,
    status: 'published',
    featured_image_url: featuredImageUrl || null,
    image_alt_text: `${keyword} em Moçambique`,
    external_links: [],
    internal_links: [
      { title: 'Ver produtos na LojaRápida', url: 'https://lojarapidamz.com/produtos' },
      { title: 'Vender na LojaRápida', url: 'https://lojarapidamz.com/register' },
    ],
    secondary_keywords: article.secondary_keywords || [],
    seo_score: 80,
    readability_score: 'Bom',
    category_id: categoryId,
    image_prompt: null,
    context: keyword,
    audience: 'compradores em Moçambique',
    published_at: new Date().toISOString(),
  })

  if (error) throw new Error(`DB insert: ${error.message}`)

  return { skipped: false, url: `https://lojarapidamz.com/blog/${slug}` }
}

// ─── MÓDULO E: Loop principal ─────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 LojaRápida SEO Bot')
  console.log(`   Modo:  ${DRY_RUN ? 'DRY RUN (não publica)' : 'PUBLICAÇÃO REAL'}`)
  if (isFinite(LIMIT)) console.log(`   Limite: ${LIMIT} artigos`)
  console.log()

  // 1. Recolher keywords via Google Suggest
  console.log('📡 A recolher keywords do Google Suggest...\n')
  const allKeywords = new Set()

  for (const seed of SEEDS) {
    const kws = await getKeywords(seed)
    kws.forEach(k => allKeywords.add(k))
    console.log(`  ✓ "${seed}" → ${kws.length} sugestões`)
    await sleep(500)
  }

  console.log(`\n  Total único: ${allKeywords.size} keywords\n`)

  // 2. Filtrar keywords já publicadas (compara com campo "context")
  const { data: existingArticles } = await supabase
    .from('published_articles')
    .select('context')
    .eq('status', 'published')

  const publishedContexts = new Set(
    (existingArticles || []).map(a => a.context?.toLowerCase().trim()).filter(Boolean)
  )

  const newKeywords = [...allKeywords].filter(k => !publishedContexts.has(k))
  console.log(
    `📋 ${newKeywords.length} keywords novas (${allKeywords.size - newKeywords.length} já publicadas)\n`
  )

  if (newKeywords.length === 0) {
    console.log('✅ Todas as keywords já têm artigo publicado.\n')
    return
  }

  // 3. Processar cada keyword
  const toProcess = newKeywords.slice(0, isFinite(LIMIT) ? LIMIT : newKeywords.length)
  let generated = 0
  let skipped = 0
  let errors = 0

  for (const keyword of toProcess) {
    const idx = generated + skipped + errors + 1
    console.log(`\n[${idx}/${toProcess.length}] "${keyword}"`)

    // 3a. Busca produtos relacionados
    const products = await getProductsForKeyword(keyword)
    console.log(`  Produtos: ${products.length}`)

    if (products.length === 0) {
      console.log('  ⏭️  Sem produtos relacionados — a saltar')
      skipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`  🔍 DRY RUN — produtos: ${products.map(p => `${p.name} (${p.price} MZN)`).join(' | ')}`)
      generated++
      continue
    }

    try {
      // 3b. Gera artigo
      console.log('  ✏️  A gerar artigo com GPT-4o mini...')
      const article = await generateArticle(keyword, products)
      console.log(`  ✓ Título: "${article.title}"`)
      console.log(`  ✓ Slug:   "${article.slug || slugify(article.title)}"`)

      // 3c. Publica
      const featuredImage = products[0]?.image_url || null
      const result = await publishArticle(article, keyword, featuredImage)

      if (result.skipped) {
        console.log(`  ⚠️  Saltado: ${result.reason}`)
        skipped++
      } else {
        console.log(`  ✅ Publicado: ${result.url}`)
        generated++
      }
    } catch (err) {
      console.error(`  ❌ Erro: ${err.message}`)
      errors++
    }

    await sleep(3000)
  }

  // 4. Resumo
  const sep = '─'.repeat(50)
  console.log(`\n${sep}`)
  console.log('📊 Resumo:')
  console.log(`   Artigos gerados:   ${generated}`)
  console.log(`   Saltados:          ${skipped}`)
  console.log(`   Erros:             ${errors}`)
  console.log(`   Total processado:  ${generated + skipped + errors} / ${toProcess.length}`)
  console.log(`${sep}\n`)
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message)
  process.exit(1)
})
