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
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'LojaRapida <contato@lojarapidamz.com>'
// @ts-ignore
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ADMIN_EMAIL = 'lojarapidamz@outlook.com'

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // --- BLOCO DE AUTENTICAÇÃO ADICIONADO ---
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  const token = authHeader.replace('Bearer ', '')

  let isAuthorized = false

  // Verificação 1: É a chave de serviço (usada por gatilhos do banco de dados)?
  if (token === SERVICE_ROLE_KEY) {
    isAuthorized = true
  } else {
    // Verificação 2: É um token de usuário válido do administrador?
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (user && user.email === ADMIN_EMAIL) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  // --- FIM DO BLOCO DE AUTENTICAÇÃO ---

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing parameters: to, subject, html' }), { status: 400, headers: corsHeaders })
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: to,
        subject: subject,
        html: html,
      }),
    })

    const data = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API Error:', data)
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(JSON.stringify({ success: true, data }), { headers: corsHeaders, status: 200 })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 })
  }
})