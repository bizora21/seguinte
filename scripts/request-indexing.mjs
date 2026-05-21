/**
 * LojaRápida — Google Indexing API
 * Pede indexação imediata dos artigos publicados nas últimas 24h.
 *
 * PRÉ-REQUISITOS (configurar uma vez):
 *   1. Google Search Console → Configurações → Utilizadores e permissões
 *      → Adicionar utilizador (email do service account, permissão Proprietário)
 *   2. Google Cloud Console → IAM → Service Accounts → Criar conta
 *      → Atribuir papel "Indexing API" → Transferir chave JSON
 *   3. Google Cloud Console → APIs → activar "Web Search Indexing API"
 *   4. Guardar o ficheiro JSON da chave em: scripts/google-service-account.json
 *      (já está no .gitignore — NUNCA commitar)
 *
 * USO:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/request-indexing.mjs
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/request-indexing.mjs --hours=48
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/request-indexing.mjs --slug=meu-artigo
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { createSign } from 'crypto'

// ─── Configuração ─────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bpzqdwpkwlwflrcwcrqp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BASE_URL = 'https://lojarapidamz.com'
const SERVICE_ACCOUNT_PATH = new URL('./google-service-account.json', import.meta.url).pathname

// ─── Argumentos CLI ───────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const hoursArg = args.find(a => a.startsWith('--hours='))
const slugArg  = args.find(a => a.startsWith('--slug='))
const HOURS    = hoursArg ? parseInt(hoursArg.split('=')[1], 10) : 24
const SLUG     = slugArg  ? slugArg.split('=')[1] : null

// ─── Validações ───────────────────────────────────────────────────────────────
if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY não definida.\n')
  process.exit(1)
}

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('\n❌ Ficheiro de credenciais não encontrado:')
  console.error(`   ${SERVICE_ACCOUNT_PATH}`)
  console.error('\n   Segue os PRÉ-REQUISITOS no topo deste ficheiro.\n')
  process.exit(1)
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── JWT para Google API (OAuth2 Service Account) ────────────────────────────
function buildJwt(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss:   serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url')

  const sign = createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const signature = sign.sign(serviceAccount.private_key, 'base64url')

  return `${header}.${payload}.${signature}`
}

async function getAccessToken(serviceAccount) {
  const jwt = buildJwt(serviceAccount)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(`Falha ao obter token: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

// ─── Google Indexing API ──────────────────────────────────────────────────────
async function requestIndexing(accessToken, url, type = 'URL_UPDATED') {
  const res = await fetch(
    'https://indexing.googleapis.com/v3/urlNotifications:publish',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type }),
    }
  )
  return { status: res.status, data: await res.json() }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📡 LojaRápida — Google Indexing API')

  // Carrega credenciais
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))
  console.log(`   Service Account: ${serviceAccount.client_email}`)

  // Obtém token OAuth2
  console.log('   A obter token de acesso...')
  const accessToken = await getAccessToken(serviceAccount)
  console.log('   ✓ Token obtido\n')

  // Busca artigos
  let query = supabase
    .from('published_articles')
    .select('slug, published_at, updated_at')
    .eq('status', 'published')

  if (SLUG) {
    query = query.eq('slug', SLUG)
    console.log(`🔍 Artigo específico: ${SLUG}\n`)
  } else {
    const since = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString()
    query = query.gte('published_at', since).order('published_at', { ascending: false })
    console.log(`🕐 Artigos das últimas ${HOURS}h\n`)
  }

  const { data: articles, error } = await query
  if (error) throw new Error(`Supabase: ${error.message}`)

  if (!articles || articles.length === 0) {
    console.log('ℹ️  Nenhum artigo encontrado no período.\n')
    return
  }

  console.log(`📋 ${articles.length} artigo(s) para indexar:\n`)

  let success = 0
  let failed  = 0

  for (const article of articles) {
    const url = `${BASE_URL}/blog/${article.slug}`
    process.stdout.write(`  → ${url} ... `)

    try {
      const { status, data } = await requestIndexing(accessToken, url)
      if (status === 200) {
        console.log(`✅ OK (${data.urlNotificationMetadata?.latestUpdate?.type || 'indexado'})`)
        success++
      } else {
        console.log(`⚠️  HTTP ${status}: ${data.error?.message || JSON.stringify(data)}`)
        failed++
      }
    } catch (e) {
      console.log(`❌ ${e.message}`)
      failed++
    }

    // Respeita rate limit: 200 req/dia, pausa entre pedidos
    await new Promise(r => setTimeout(r, 200))
  }

  const sep = '─'.repeat(50)
  console.log(`\n${sep}`)
  console.log('📊 Resumo:')
  console.log(`   Indexados com sucesso: ${success}`)
  console.log(`   Falhados:              ${failed}`)
  console.log(`   Total:                 ${articles.length}`)
  console.log(`${sep}\n`)
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message)
  process.exit(1)
})
