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
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ''

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

if (!UNSPLASH_ACCESS_KEY) {
  console.log('  ⚠️  UNSPLASH_ACCESS_KEY não definida — artigos sem produtos serão saltados')
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

// ─── Mapeamento keyword → categoria ──────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  roupa:       ['roupas', 'vestuario', 'moda', 'sapatos', 'calcado', 'bolsas',
                'acessorios', 'conjunto', 'camisa', 'calcas', 'vestido',
                'capulana', 'casaco', 'fato', 'saia', 'blusa', 'sapato', 'tenis'],
  saude:       ['saude', 'beleza', 'cosmeticos', 'perfume', 'creme',
                'suplemento', 'vitamina', 'farmacia', 'cosmetico', 'hidratante'],
  cozinha:     ['cozinha', 'utensilios', 'panela', 'frigideira',
                'cortador', 'amassador', 'alimentos', 'culinaria', 'prato'],
  electronica: ['electronica', 'telemovel', 'computador', 'laptop',
                'suporte', 'carregador', 'auscultadores', 'tablet',
                'smartphone', 'eletronico', 'ecra', 'cabo'],
  geral:       ['produto', 'comprar', 'loja', 'marketplace', 'online', 'mercado'],
}

// Mapa invertido: palavra normalizada → nome da categoria
const KEYWORD_TO_CATEGORY = {}
for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
  for (const w of words) KEYWORD_TO_CATEGORY[w] = cat
}

function normalizeWord(w) {
  return w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// ─── MÓDULO A: Google Suggest + DuckDuckGo ────────────────────────────────────
async function fetchGoogle(q) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}&hl=pt`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data[1] || []).map(s => s.toLowerCase().trim())
  } catch { return [] }
}

async function fetchDuckDuckGo(q) {
  try {
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const data = await res.json()
    // Formato DDG: [query, [sugestões]]
    return (data[1] || []).map(s => s.toLowerCase().trim())
  } catch { return [] }
}

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

  // Google + DDG em paralelo por variação
  for (const v of variations) {
    const [googleResults, ddgResults] = await Promise.all([
      fetchGoogle(v),
      fetchDuckDuckGo(v),
    ])
    googleResults.forEach(s => all.add(s))
    ddgResults.forEach(s => all.add(s))
    await sleep(300)
  }

  return [...all]
}

// Keywords geradas directamente da base de dados (categorias + produtos)
async function getDbKeywords() {
  const all = new Set()

  // 1. Categorias únicas → 5 variações cada
  const { data: catRows } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)

  const categories = [
    ...new Set((catRows || []).map(r => r.category?.toLowerCase().trim()).filter(Boolean)),
  ]

  for (const cat of categories) {
    all.add(`onde comprar ${cat} em moçambique`)
    all.add(`onde comprar ${cat} em maputo`)
    all.add(`preço ${cat} moçambique`)
    all.add(`melhores ${cat} moçambique`)
    all.add(`lojas de ${cat} em maputo`)
  }

  // 2. Nomes de produtos → 2 variações cada (máx 60 produtos)
  const { data: products } = await supabase
    .from('products')
    .select('name')
    .limit(60)

  for (const p of products || []) {
    const name = p.name?.toLowerCase().trim()
    if (!name) continue
    all.add(`onde comprar ${name} moçambique`)
    all.add(`preço ${name} maputo`)
  }

  return [...all]
}

// ─── MÓDULO B: Produtos relevantes do Supabase ───────────────────────────────
async function getProductsForKeyword(keyword) {
  const normalised = keyword.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')

  // Stopwords — palavras que não servem para busca
  const stopwords = new Set([
    'onde', 'como', 'para', 'mais', 'melhor', 'melhores',
    'comprar', 'vender', 'mocambique', 'maputo', 'preco',
    'loja', 'lojas', 'site', 'online', 'barato', 'mundo',
    'portugal', 'brasil', 'angola', 'cidade', 'lugar',
    'lugares', 'turismo', 'eleicoes', 'servicos', 'empresas',
    'noticias', 'cultura', 'saude', 'todos', 'cosmica',
    'localizacao', 'shopping', 'centre', 'carros', 'motos',
    'venda', 'vendas', 'compras', 'fazer', 'encontrar',
    'quais', 'site', 'sites'
  ])

  // Mapeamento keyword → categoria na BD
  // Palavras de nome que identificam produtos cosméticos reais
  const COSMETIC_WORDS = [
    'perfume', 'creme', 'gel', 'hidratante', 'shampoo',
    'sabao', 'sabonete', 'maquilhagem', 'batom', 'base',
    'blush', 'sombra', 'rimel', 'fragancia', 'colonia',
    'desodorizante', 'locao', 'locão', 'serum', 'tonico',
    'tônico', 'esfoliante', 'mascara', 'condicionador',
  ]

  const KEYWORD_TO_CATEGORY = {
    'roupa':     ['roupa', 'moda', 'vestuario'],
    'roupas':    ['roupa', 'moda', 'vestuario'],
    'vestuario': ['roupa', 'moda'],
    'moda':      ['roupa', 'moda'],
    'conjunto':  ['roupa', 'moda'],
    'camisa':    ['roupa', 'moda'],
    'calcas':    ['roupa', 'moda'],
    'vestido':   ['roupa', 'moda'],
    'capulana':  ['roupa', 'moda'],
    'casaco':    ['roupa', 'moda'],
    'tshirt':    ['roupa', 'moda'],
    'blusa':     ['roupa', 'moda'],
    'sapato':    ['roupa', 'calcado'],
    'sapatos':   ['roupa', 'calcado'],
    'calcado':   ['roupa', 'calcado'],
    'tenis':     ['roupa', 'calcado'],
    'sandalia':  ['roupa', 'calcado'],
    'bota':      ['roupa', 'calcado'],
    'bolsa':     ['roupa', 'acessorios'],
    'bolsas':    ['roupa', 'acessorios'],
    'mala':      ['roupa', 'acessorios'],
    'mochila':   ['roupa', 'acessorios'],
    'acessorio': ['acessorios', 'roupa'],
    'acessorios':['acessorios', 'roupa'],
    'colar':     ['acessorios'],
    'pulseira':  ['acessorios'],
    'oculos':    ['acessorios'],
    'cosmetico': ['cosmeticos'],
    'cosmeticos':['cosmeticos'],
    'beleza':    ['cosmeticos'],
    'maquilhagem':['cosmeticos'],
    'creme':     ['cosmeticos'],
    'hidratante':['cosmeticos'],
    'perfume':   ['cosmeticos', 'outros'],
    'perfumes':  ['cosmeticos', 'outros'],
    'fragancia': ['cosmeticos', 'outros'],
    'suplemento':['saude'],
    'vitamina':  ['saude'],
    'massageador':['saude'],
    'cozinha':   ['cozinha'],
    'utensilio': ['cozinha'],
    'utensilios':['cozinha'],
    'panela':    ['cozinha'],
    'cortador':  ['cozinha'],
    'amassador': ['cozinha'],
    'fatiador':  ['cozinha'],
    'electronica':['electronica', 'tecnologia'],
    'telemovel': ['electronica', 'tecnologia'],
    'computador':['electronica', 'tecnologia'],
    'laptop':    ['electronica', 'tecnologia'],
    'suporte':   ['electronica'],
    'carregador':['electronica'],
    'playstation':['electronica', 'jogos'],
    'xbox':      ['electronica', 'jogos'],
    'jogo':      ['electronica', 'jogos'],
    'jogos':     ['electronica', 'jogos'],
    'consola':   ['electronica', 'jogos'],
    'gel':       ['cosmeticos'],
    'jardinagem':['jardim'],
  }

  // PASSO 1: Encontra palavras relevantes na keyword
  const words = normalised.split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))

  if (words.length === 0) return []

  // Filtro de relevância: retorna produtos cujo nome contém palavra da keyword
  // Sem fallback — se nenhum passa, retorna []
  const filterByRelevance = (prods) => {
    return prods.filter(p => {
      const nameNorm = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      return words.some(w => nameNorm.includes(w))
    })
  }

  // Filtro cosmético: quando a keyword é de beleza, aceita apenas produtos com
  // nomes que contêm palavras cosméticas reconhecidas (evita massageadores, etc.)
  const isCosmeticKeyword = words.some(w =>
    ['cosmetico', 'cosmeticos', 'beleza', 'maquilhagem', 'creme', 'hidratante',
     'perfume', 'perfumes', 'fragancia', 'gel'].includes(w)
  )
  const filterCosmetics = (prods) => {
    if (!isCosmeticKeyword) return prods
    const filtered = prods.filter(p => {
      const nameNorm = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      return COSMETIC_WORDS.some(cw => nameNorm.includes(cw))
    })
    return filtered  // retorna [] se nenhum produto cosmético encontrado
  }

  // PASSO 2: Verifica se alguma palavra mapeia para categoria
  let targetCategories = null
  for (const word of words) {
    if (KEYWORD_TO_CATEGORY[word]) {
      targetCategories = KEYWORD_TO_CATEGORY[word]
      break
    }
  }

  // PASSO 3: Se encontrou categoria, busca por categoria
  if (targetCategories) {
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, price, image_url, category, description,
        seller:profiles!seller_id(store_name, city, delivery_scope)
      `)
      .in('category', targetCategories)
      .limit(8)

    if (data && data.length > 0) {
      const mapped = filterByRelevance(data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: resolveImageUrl(p.image_url),
        category: p.category,
        store_name: p.seller?.store_name || 'Vendedor LojaRápida',
        city: p.seller?.city || 'Moçambique',
        delivery_scope: Array.isArray(p.seller?.delivery_scope)
          ? p.seller.delivery_scope : [],
      })))
      const final = filterCosmetics(mapped)
      if (final.length > 0) return final
    }
  }

  // PASSO 4: Tenta ILIKE no nome E descrição do produto
  for (const word of words) {
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, price, image_url, category, description,
        seller:profiles!seller_id(store_name, city, delivery_scope)
      `)
      .ilike('name', `%${word}%`)
      .limit(8)

    if (data && data.length > 0) {
      const mapped = filterByRelevance(data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: resolveImageUrl(p.image_url),
        category: p.category,
        store_name: p.seller?.store_name || 'Vendedor LojaRápida',
        city: p.seller?.city || 'Moçambique',
        delivery_scope: Array.isArray(p.seller?.delivery_scope)
          ? p.seller.delivery_scope : [],
      })))
      const final = filterCosmetics(mapped)
      if (final.length > 0) return final
    }
  }

  // PASSO 5: Sem produtos relevantes → retorna []
  // NUNCA usa fallback genérico
  return []
}

// ─── MÓDULO F: Unsplash Image Search ─────────────────────────────────────────
async function getUnsplashImage(keyword, usedImages = new Set()) {
  if (!UNSPLASH_ACCESS_KEY) return null

  const TRANSLATIONS = {
    'sapatos': 'shoes',
    'roupa': 'clothing fashion',
    'roupas': 'clothing fashion africa',
    'cosmeticos': 'cosmetics beauty',
    'cosméticos': 'cosmetics beauty',
    'perfume': 'perfume fragrance',
    'cozinha': 'kitchen cooking',
    'electronica': 'electronics technology',
    'electrónica': 'electronics technology',
    'mercado': 'market africa',
    'moda': 'fashion africa',
    'beleza': 'beauty cosmetics',
    'acessorios': 'accessories fashion',
    'acessórios': 'accessories fashion',
    'bolsas': 'bags handbags',
    'calcado': 'shoes footwear',
    'calçado': 'shoes footwear',
    'telemovel': 'smartphone mobile',
    'telemóvel': 'smartphone mobile',
    'computador': 'computer laptop',
    'mocambique': 'mozambique africa market',
    'moçambique': 'mozambique africa market',
    'maputo': 'maputo mozambique',
  }

  const words = keyword.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)

  let searchQuery = 'mozambique market shop'
  for (const word of words) {
    if (TRANSLATIONS[word]) {
      searchQuery = TRANSLATIONS[word] + ' africa'
      break
    }
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1',
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results || data.results.length === 0) return null

    const validImgs = data.results.filter(r => r.width >= 1200)
    const pool = validImgs.length > 0 ? validImgs : data.results

    const available = pool.filter(r => !usedImages.has(r.id))
    const finalPool = available.length > 0 ? available : pool
    const img = finalPool[Math.floor(Math.random() * finalPool.length)]

    usedImages.add(img.id)

    return {
      id: img.id,
      url: img.urls.regular,
      full: img.urls.full,
      alt: img.alt_description || searchQuery,
      credit: img.user.name,
      credit_url: img.user.links.html,
    }
  } catch { return null }
}

// ─── MÓDULO C: Gera artigo com GPT ───────────────────────────────────────────
async function generateArticle(keyword, products) {
  const kwNorm = keyword.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const kwWords = kwNorm.split(/\s+/).filter(w => w.length > 3)

  const productList = products.map(p => {
    const nameNorm = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const isRelevant = kwWords.some(w => nameNorm.includes(w))
    return `- ${p.name}: ${p.price} MZN
  Vendedor: ${p.store_name} (${p.city})
  Link: https://lojarapidamz.com/produto/${p.id}
  Imagem: ${isRelevant ? (p.image_url || 'sem imagem') : 'NAO USAR IMAGEM'}
  Relevância: ${isRelevant ? 'PRODUTO PRINCIPAL - menciona no texto' : 'produto secundário - pode mencionar brevemente'}`
  }).join('\n\n')

  const prompt = `
Escreve um artigo em português europeu sobre: "${keyword}"

Dados reais de produtos disponíveis na LojaRápida
(marketplace moçambicano):
${productList}

ESTILO DE ESCRITA — MUITO IMPORTANTE:
- Escreve como um jornalista ou blogger moçambicano experiente
- Tom conversacional e próximo, como se falasses com um amigo
- Usa expressões naturais do português moçambicano
- NUNCA uses as palavras: "Introdução", "Conclusão", "Em resumo",
  "Neste artigo", "Vamos explorar", "Mergulhar", "Abrangente",
  "Como todos sabemos", "É importante notar"
- Não dividas em secções óbvias com títulos genéricos
- Começa directamente com uma frase forte e relevante
  Exemplo: "Encontrar bons sapatos em Maputo já não é o que era."
  Em vez de: "Introdução: Neste artigo vamos explorar..."

ESTRUTURA OBRIGATÓRIA DO ARTIGO (700-900 palavras):

Parágrafo de abertura (sem h2):
  Frase forte e directa sobre o tema em Moçambique.
  2-3 parágrafos de contextualização local.

<h2>[Título relevante sobre o mercado em MZ]</h2>
  2-3 parágrafos sobre onde encontrar, preços, contexto.

<h2>[Título sobre como comprar online com segurança]</h2>
  2 parágrafos sobre comprar online em Moçambique,
  pagamento na entrega, vantagens.

<h2>Produtos disponíveis na LojaRápida</h2>
  Tabela ou lista com produtos reais, preços, vendedores.

<h2>[Título sobre dica prática para o leitor]</h2>
  1-2 parágrafos com conselho específico para Moçambique.

Parágrafo final natural + bloco CTA

REGRAS DOS SUBTÍTULOS:
- Mínimo 3 subtítulos h2 por artigo
- Subtítulos devem ser frases naturais, não genéricas
  CORRECTO: 'Onde encontrar sapatos de qualidade em Maputo'
  ERRADO: 'Subtítulo 2' ou 'Onde comprar'
- Usa h3 dentro de secções quando necessário

REGRA DE IMAGEM CRÍTICA:
A imagem principal já aparece automaticamente no topo do artigo
como featured image. NÃO incluas nenhuma tag <img> adicional
no início do artigo.
Podes incluir imagens APENAS no meio do texto quando forem
de produtos DIFERENTES do produto principal.
Se só tens 1 produto, não incluas nenhuma <img> no conteúdo HTML.

REGRAS DE IMAGENS:
- Só inclui <img> se a imagem for do produto mencionado nesse parágrafo
- Formato: <img src="URL" alt="nome do produto em Moçambique" loading="lazy" style="max-width:100%;border-radius:8px;margin:16px 0">
- Se a imagem não for relevante para o parágrafo, não a incluas

REGRAS DE TABELAS:
- Só cria tabela se tiveres 3+ produtos com dados completos
- Usa APENAS preços e nomes REAIS dos dados fornecidos
- Não inventes preços nem produtos
- Se os produtos não são suficientes para tabela útil, substitui
  por um parágrafo comparativo natural

LINKS:
- Inclui link natural para o produto:
  <a href="https://lojarapidamz.com/produto/ID">nome do produto</a>
- 1 link para categoria:
  <a href="https://lojarapidamz.com/produtos">ver mais produtos</a>

FINAL DO ARTIGO — REGRAS:
Termina com parágrafo natural que mencione a LojaRápida organicamente.

NUNCA termines com:
  "Esperamos que este artigo tenha ajudado..."
  "Não perca a oportunidade..."
  "Comece já a sua jornada..."
  "Dê o primeiro passo..."
  Qualquer frase com "descubra", "explore", "mergulhe"

Após o parágrafo final, inclui SEMPRE este bloco CTA:
<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin:24px 0">
  <p style="font-weight:600;color:#166534;margin:0 0 12px 0">📦 Disponível na LojaRápida</p>
  <p style="color:#374151;margin:0 0 16px 0;font-size:15px">Pagamento na entrega · Vendedores verificados · Entrega em Maputo e Beira</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <a href="https://lojarapidamz.com/produtos" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Ver produtos disponíveis</a>
    <a href="https://lojarapidamz.com/register" style="background:#1e40af;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Criar conta gratuita</a>
  </div>
</div>

META DESCRIPTION — REGRAS ESTRITAS:
- Máximo 160 caracteres
- Escreve como uma frase natural que uma pessoa diria
- NUNCA uses: descubra, descobre, explore, mergulhe, saiba mais,
  clique aqui, veja como, aprenda, transforme, revolucione,
  incrível, fantástico
- Formato: frase directa que responde à pergunta do utilizador

  Exemplos CORRECTOS:
  "O Perfume Full Flow está disponível em Moçambique a 505 MZN com entrega em Maputo e Beira."
  "Onde comprar perfume em Moçambique: lojas, preços e opções de entrega em Maputo."

  Exemplos ERRADOS:
  "Descubra os melhores perfumes..."
  "Explore as melhores opções..."
  "Saiba tudo sobre perfumes..."

COMPRIMENTO: 700-900 palavras. Nem mais nem menos.

Retorna JSON com exactamente:
{
  "title": "título directo e humano (máx 60 chars) — PROIBIDO: 'Guia Completo', 'Descubra', 'Descobre', 'Tudo sobre', 'Tudo que precisa', 'Saiba tudo', 'O que você precisa saber' — CORRECTO: 'Perfume em Moçambique: onde comprar e quanto custa'",
  "meta_description": "frase natural sem palavras de IA (máx 160 chars)",
  "slug": "url-sem-acentos-sem-guia-completo-sem-descubra",
  "content": "HTML do artigo sem tags html/body/head",
  "category": "categoria em português (Moda, Beleza, Tecnologia, Cozinha)",
  "secondary_keywords": ["kw1", "kw2", "kw3"]
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

// ─── Gera artigo informativo sem produtos (usa imagem Unsplash) ──────────────
async function generateArticleNoProducts(keyword, image) {
  const prompt = `
Escreve um artigo em português europeu sobre: "${keyword}"

Este artigo é para um marketplace moçambicano chamado LojaRápida
(lojarapidamz.com) onde qualquer pessoa pode comprar e vender online
com pagamento na entrega.

CONTEXTO: Não temos produtos específicos para mostrar,
mas queremos informar o leitor sobre este tema em Moçambique.

ESTILO:
- Tom jornalístico e local, como um blogger moçambicano
- Menciona cidades reais: Maputo, Beira, Nampula
- Inclui contexto do mercado moçambicano
- NUNCA uses: descubra, descobre, explorar, mergulhar,
  neste artigo, em conclusão, guia completo
- Começa directamente com frase forte sobre o tema em MZ

ESTRUTURA OBRIGATÓRIA DO ARTIGO (700-900 palavras):

Parágrafo de abertura (sem h2):
  Frase forte e directa sobre o tema em Moçambique.
  2-3 parágrafos de contextualização local.

<h2>[Título sobre onde encontrar / contexto do mercado em MZ]</h2>
  2-3 parágrafos sobre preços aproximados, onde se encontra.

<h2>[Título sobre como comprar com segurança online]</h2>
  2 parágrafos sobre vantagens de comprar online em Moçambique.

<h2>[Título sobre dica prática para o leitor]</h2>
  1-2 parágrafos com conselho específico para Moçambique.

Parágrafo final natural + bloco CTA

REGRAS DOS SUBTÍTULOS:
- Mínimo 3 subtítulos h2
- Frases naturais e específicas, não genéricas
- Usa h3 dentro de secções quando necessário

REGRA DE IMAGEM CRÍTICA:
A imagem principal já aparece automaticamente no topo da página
como featured image. NÃO incluas nenhuma tag <img> no artigo.
Inclui apenas a atribuição de crédito em texto:

IMAGEM DISPONÍVEL:
URL: ${image.url}
Crédito: Photo by ${image.credit} on Unsplash

No início do artigo, inclui apenas o crédito (sem <img>):
<p style="font-size:12px;color:#888;margin-bottom:24px">Foto: <a href="${image.credit_url}" target="_blank" rel="noopener">${image.credit}</a> / Unsplash</p>

BLOCO CTA no final do artigo:
<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:20px;margin:24px 0">
  <p style="font-weight:600;color:#1e40af;margin:0 0 12px 0">🛍️ Compra e vende online em Moçambique</p>
  <p style="color:#374151;margin:0 0 16px 0;font-size:15px">A LojaRápida é o marketplace moçambicano com pagamento na entrega. Abre a tua loja gratuitamente ou compra com segurança.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <a href="https://lojarapidamz.com/produtos" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Ver produtos</a>
    <a href="https://lojarapidamz.com/register" style="background:#0f172a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Abrir loja grátis</a>
  </div>
</div>

META DESCRIPTION — REGRAS ESTRITAS:
- NUNCA uses: descubra, descobre, explore, mergulhe, saiba mais,
  clique aqui, veja como, aprenda, transforme, revolucione
- Frase directa que responde à pergunta do utilizador (máx 160 chars)

Retorna JSON com exactamente:
{
  "title": "título natural sem descubra/guia (máx 60 chars)",
  "meta_description": "frase directa sem descubra/explore (máx 160 chars)",
  "slug": "slug-sem-acentos",
  "content": "HTML completo do artigo sem tags html/body/head",
  "category": "categoria em português (Moda, Beleza, Tecnologia, Cozinha)",
  "secondary_keywords": ["kw1", "kw2", "kw3"]
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
async function publishArticle(article, keyword, products) {
  const slug = article.slug || slugify(article.title)

  // Selecciona imagem do produto mais relevante para a keyword
  const kwNorm = keyword.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const kwWords = kwNorm.split(/\s+/).filter(w => w.length > 3)
  const relevantProduct = products.find(p => {
    const nameNorm = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return kwWords.some(w => nameNorm.includes(w))
  })
  const featuredImage = relevantProduct?.image_url
    ? resolveImageUrl(relevantProduct.image_url)
    : null
  if (!featuredImage) {
    return { skipped: true, reason: 'sem imagem relevante para ' + keyword }
  }

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

  const now = new Date().toISOString()

  // O schema Article/NewsArticle para Google Discover é injectado pelo componente
  // BlogDetail.tsx via react-helmet-async — NÃO é embutido no content porque
  // o TipTapRenderer (StarterKit) remove <script> tags automaticamente.

  const { error } = await supabase.from('published_articles').insert({
    id: randomUUID(),
    title: article.title,
    slug,
    meta_description: article.meta_description,
    content: article.content,
    status: 'published',
    featured_image_url: featuredImage,
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
    published_at: now,
    // discover_ready requer migração: ALTER TABLE published_articles ADD COLUMN discover_ready boolean DEFAULT false;
    // discover_ready: true,
  })

  if (error) throw new Error(`DB insert: ${error.message}`)

  return { skipped: false, url: `https://lojarapidamz.com/blog/${slug}` }
}

async function publishArticleWithUnsplash(article, keyword, image) {
  const slug = article.slug || slugify(article.title)

  const { data: existing } = await supabase
    .from('published_articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return { skipped: true, reason: `slug "${slug}" já existe` }
  }

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

  const now = new Date().toISOString()

  const { error } = await supabase.from('published_articles').insert({
    id: randomUUID(),
    title: article.title,
    slug,
    meta_description: article.meta_description,
    content: article.content,
    status: 'published',
    featured_image_url: image.url,
    image_alt_text: `${keyword} em Moçambique`,
    external_links: [],
    internal_links: [
      { title: 'Ver produtos na LojaRápida', url: 'https://lojarapidamz.com/produtos' },
      { title: 'Vender na LojaRápida', url: 'https://lojarapidamz.com/register' },
    ],
    secondary_keywords: article.secondary_keywords || [],
    seo_score: 75,
    readability_score: 'Bom',
    category_id: categoryId,
    image_prompt: null,
    context: keyword,
    audience: 'compradores em Moçambique',
    published_at: now,
  })

  if (error) throw new Error(`DB insert: ${error.message}`)

  return { skipped: false, url: `https://lojarapidamz.com/blog/${slug}` }
}

function extractTheme(keyword) {
  const norm = keyword.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')

  const THEMES = [
    'sapato', 'roupa', 'cosmetic', 'perfume', 'cozinha',
    'electronica', 'telemovel', 'computador', 'bolsa',
    'acessorio', 'mercado', 'marketplace', 'compra', 'venda',
  ]

  for (const theme of THEMES) {
    if (norm.includes(theme)) return theme
  }
  return norm.split(/\s+/).filter(w => w.length > 4)[0] || keyword
}

// ─── MÓDULO E: Loop principal ─────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 LojaRápida SEO Bot')
  console.log(`   Modo:  ${DRY_RUN ? 'DRY RUN (não publica)' : 'PUBLICAÇÃO REAL'}`)
  if (isFinite(LIMIT)) console.log(`   Limite: ${LIMIT} artigos`)
  console.log()

  // 1. Recolher keywords via Google Suggest + DuckDuckGo
  console.log('📡 A recolher keywords (Google Suggest + DuckDuckGo)...\n')
  const allKeywords = new Set()

  for (const seed of SEEDS) {
    const kws = await getKeywords(seed)
    kws.forEach(k => allKeywords.add(k))
    console.log(`  ✓ "${seed}" → ${kws.length} sugestões`)
    await sleep(500)
  }

  // 1b. Keywords geradas da base de dados (categorias + produtos reais)
  console.log('\n📦 A gerar keywords a partir dos produtos da BD...')
  const dbKeywords = await getDbKeywords()
  dbKeywords.forEach(k => allKeywords.add(k))
  console.log(`  ✓ ${dbKeywords.length} keywords geradas da BD`)

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

  // Filtro de keywords irrelevantes (fora do nicho de e-commerce MZ)
  const IRRELEVANT_PATTERNS = [
    'portugal', 'brasil', 'angola', 'sao paulo', ' sp ',
    'mais caros do mundo', 'noticias', 'sapo', 'youtube',
    'facebook', 'instagram', 'tiktok', 'eleicoes', 'eleições',
    'resultado das', 'turismo', 'lugares turisticos',
    'electricidade', 'agua corrente',
    'servicos de internet', 'serviços de internet',
    'empresas de limpeza', 'carros', 'motos', 'cosmica',
    'localizacao', 'maputo-mozambique', 'mozambique-maputo',
    'cidade de maputo', 'o que fazer', 'lojas de outros',
    'outros em maputo', 'cósmica', 'governo',
    'mega distribuição', 'janela única', 'janela unica',
    'combustível', 'combustivel', 'show me', 'near me',
    'reviews', 'food near', 'cuisine', 'mozambique food',
    'comidas típicas', 'comidas tipicas', 'pratos típicos',
    'pratos tipicos', 'comida típica', 'comida tipica',
    'moçambique para todos', 'capital de moçambique',
    'onde se localiza', 'procuro mapa', 'viagem para',
    'maior marketplace do mundo', 'mercado livre',
    'imóveis', 'imoveis', 'motorizadas', 'pneus',
    'vodacom', 'movitel', 'smile', 'governo electronico',
  ]

  const filteredKeywords = newKeywords.filter(kw =>
    !IRRELEVANT_PATTERNS.some(p => kw.includes(p))
  )

  console.log(`🔍 ${filteredKeywords.length} keywords após filtro\n`)

  if (filteredKeywords.length === 0) {
    console.log('✅ Nenhuma keyword relevante após filtro.\n')
    return
  }

  // 3. Processar cada keyword até atingir o limite de artigos GERADOS
  let generated = 0
  let skipped = 0
  let errors = 0
  const limitLabel = isFinite(LIMIT) ? `/ ${LIMIT}` : ''
  const processedThemes = new Set()
  const usedImages = new Set()

  for (const keyword of filteredKeywords) {
    // Para quando o número de artigos gerados atingir o limite
    if (isFinite(LIMIT) && generated >= LIMIT) break

    const idx = generated + skipped + errors + 1
    console.log(`\n[${idx} — gerados: ${generated}${limitLabel}] "${keyword}"`)

    // 3a. Busca produtos relacionados
    const products = await getProductsForKeyword(keyword)
    console.log(`  Produtos: ${products.length}`)

    if (products.length === 0) {
      // Evita artigos demasiado similares: 1 artigo Unsplash por tema
      const theme = extractTheme(keyword)
      if (processedThemes.has(theme)) {
        console.log(`  ⏭️  Tema "${theme}" já processado — a saltar`)
        skipped++
        continue
      }

      // Tenta Unsplash antes de saltar
      const unsplashImg = await getUnsplashImage(keyword, usedImages)

      if (!unsplashImg) {
        console.log('  ⏭️  Sem produtos nem imagem — a saltar')
        skipped++
        continue
      }

      processedThemes.add(theme)
      console.log(`  🖼️  Unsplash: ${unsplashImg.alt}`)

      if (DRY_RUN) {
        console.log('  🔍 DRY RUN — imagem Unsplash encontrada')
        generated++
        continue
      }

      try {
        const article = await generateArticleNoProducts(keyword, unsplashImg)
        console.log(`  ✓ Título: "${article.title}"`)
        console.log(`  ✓ Slug:   "${article.slug || slugify(article.title)}"`)

        const result = await publishArticleWithUnsplash(article, keyword, unsplashImg)

        if (result.skipped) {
          console.log(`  ⚠️  Saltado: ${result.reason}`)
          skipped++
        } else {
          console.log(`  ✅ Publicado (Unsplash): ${result.url}`)
          generated++
        }
      } catch (err) {
        console.error(`  ❌ Erro: ${err.message}`)
        errors++
      }

      await sleep(3000)
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
      const result = await publishArticle(article, keyword, products)

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
  console.log(`   Total processado:  ${generated + skipped + errors}`)
  console.log(`${sep}\n`)
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message)
  process.exit(1)
})
