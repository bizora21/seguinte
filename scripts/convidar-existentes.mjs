/**
 * Script para enviar convite WhatsApp a utilizadores já existentes.
 * Usa o service_role key para contornar RLS e a Edge Function email-sender.
 *
 * Uso: node scripts/convidar-existentes.mjs
 *
 * Variáveis de ambiente necessárias (ou defina directamente nas constantes abaixo):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

// ─── Configuração ─────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bpzqdwpkwlwflrcwcrqp.supabase.co'

// IMPORTANTE: usa a service_role key (nunca expor no front-end!)
// Gera em: Supabase → Project Settings → API → service_role
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const WHATSAPP_LINKS = {
  vendedor: 'https://chat.whatsapp.com/BpqBKP5aUnS0U195dvM52p',
  cliente:  'https://chat.whatsapp.com/J6zMoginc8I3nfNo270RAu',
}

// ─── Validação ────────────────────────────────────────────────────────────────
if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY não definida.')
  console.error('   Passe via variável de ambiente:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/convidar-existentes.mjs\n')
  process.exit(1)
}

// ─── Cliente Supabase com service_role ────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Templates de email inline ────────────────────────────────────────────────
function buildSellerHtml(storeName) {
  return `<!DOCTYPE html>
<html lang="pt-MZ">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f7f9fa;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.05)">
    <div style="background:#0A2540;padding:20px;text-align:center">
      <span style="font-size:24px;font-weight:bold;color:#fff">⚡ LojaRápida</span>
    </div>
    <div style="padding:30px;color:#333;line-height:1.6">
      <h2 style="color:#00D4AA;margin-top:0">Olá, ${storeName}!</h2>
      <p>A sua loja foi criada com sucesso na LojaRápida.</p>
      <div style="background:#e8fdf0;padding:20px;border-radius:12px;border:2px solid #25D366;text-align:center">
        <p style="font-size:16px;font-weight:bold;color:#128C7E;margin:0 0 8px 0">📱 Entre na nossa comunidade de vendedores!</p>
        <p style="font-size:14px;color:#333;margin:0 0 12px 0">Receba dicas de vendas, suporte directo e seja o primeiro a saber das novidades.</p>
        <a href="${WHATSAPP_LINKS.vendedor}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">📱 Entrar no Grupo de Vendedores</a>
        <div style="margin-top:12px;font-size:13px;color:#555">
          <div>✅ Dicas para vender mais</div>
          <div>✅ Suporte directo da equipa</div>
          <div>✅ Novidades da plataforma</div>
          <div>✅ Comunidade de outros vendedores</div>
        </div>
      </div>
    </div>
    <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#666">
      Equipa LojaRápida · lojarapidamz.com
    </div>
  </div>
</body>
</html>`
}

function buildClientHtml() {
  return `<!DOCTYPE html>
<html lang="pt-MZ">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f7f9fa;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.05)">
    <div style="background:#0A2540;padding:20px;text-align:center">
      <span style="font-size:24px;font-weight:bold;color:#fff">⚡ LojaRápida</span>
    </div>
    <div style="padding:30px;color:#333;line-height:1.6">
      <h2 style="color:#00D4AA;margin-top:0">Olá!</h2>
      <p>A sua conta foi criada com sucesso na LojaRápida.</p>
      <div style="background:#e8fdf0;padding:20px;border-radius:12px;border:2px solid #25D366;text-align:center">
        <p style="font-size:16px;font-weight:bold;color:#128C7E;margin:0 0 8px 0">🛍️ Ofertas exclusivas para si!</p>
        <p style="font-size:14px;color:#333;margin:0 0 12px 0">Entre na nossa comunidade de compradores e receba promoções, novidades e suporte em tempo real.</p>
        <a href="${WHATSAPP_LINKS.cliente}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">📱 Entrar no Grupo de Clientes</a>
        <div style="margin-top:12px;font-size:13px;color:#555">
          <div>✅ Promoções exclusivas</div>
          <div>✅ Novidades de produtos</div>
          <div>✅ Suporte em tempo real</div>
          <div>✅ Comunidade de compradores</div>
        </div>
      </div>
    </div>
    <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#666">
      Equipa LojaRápida · lojarapidamz.com
    </div>
  </div>
</body>
</html>`
}

// ─── Envio de email via Resend API ────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY não definida')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LojaRápida <noreply@lojarapidamz.com>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }

  return res.json()
}

// ─── Script principal ─────────────────────────────────────────────────────────
async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY não definida.')
    console.error('   Passa assim:')
    console.error('   RESEND_API_KEY=re_... node scripts/convidar-existentes.mjs')
    process.exit(1)
  }

  console.log('\n🚀 LojaRápida — Convites WhatsApp para utilizadores existentes\n')

  // 1. Buscar todos os profiles com group_invite_shown = 0
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role, store_name, group_invite_shown, group_joined')
    .eq('group_invite_shown', 0)
    .eq('group_joined', false)

  if (error) {
    console.error('❌ Erro ao buscar profiles:', error.message)
    process.exit(1)
  }

  const total = profiles?.length ?? 0
  if (total === 0) {
    console.log('✅ Nenhum utilizador pendente. Todos já foram contactados.')
    return
  }

  const vendedores = profiles.filter(p => p.role === 'vendedor')
  const clientes   = profiles.filter(p => p.role === 'cliente')

  console.log(`📊 Encontrados: ${total} utilizadores (${vendedores.length} vendedores, ${clientes.length} clientes)\n`)

  let enviados = 0
  let erros = 0

  for (const profile of profiles) {
    const isSeller  = profile.role === 'vendedor'
    const storeName = profile.store_name || 'Vendedor'
    const subject   = isSeller
      ? 'Bem-vindo à LojaRápida! Entre no nosso grupo 🎉'
      : 'Bem-vindo à LojaRápida! Ofertas exclusivas te esperam 🛍️'
    const html = isSeller ? buildSellerHtml(storeName) : buildClientHtml()

    try {
      await sendEmail(profile.email, subject, html)

      // Marcar como enviado (group_invite_shown = 1)
      await supabase
        .from('profiles')
        .update({ group_invite_shown: 1 })
        .eq('id', profile.id)

      enviados++
      console.log(`  ✅ [${enviados}/${total}] ${profile.email} (${profile.role})`)
    } catch (err) {
      erros++
      console.error(`  ❌ Falha para ${profile.email}: ${err.message}`)
    }

    // Pequena pausa para não sobrecarregar a Edge Function (rate limiting)
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n📨 Concluído: ${enviados} enviados, ${erros} erros de ${total} total.\n`)
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
