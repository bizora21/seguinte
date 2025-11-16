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
const ADMIN_EMAIL = 'lojarapidamz@outlook.com' // Definido localmente

// Helper de log para diagnóstico
// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[EMAIL-SENDER-LOG - ${new Date().toISOString()}] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  log("Function invoked.");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // --- BLOCO DE AUTENTICAÇÃO ---
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    log("Authorization failed: Missing Authorization header.");
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  const token = authHeader.replace('Bearer ', '')

  let isAuthorized = false

  // Verificação 1: É a chave de serviço? (Para chamadas PL/pgSQL)
  if (token === SERVICE_ROLE_KEY) {
    isAuthorized = true
    log("Authorization successful: Service Role Key used.");
  } else {
    // Verificação 2: É um token de usuário do administrador? (Para chamadas do frontend)
    log("Attempting to verify user token...");
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError) {
      log("Auth error:", authError);
    }
    
    // Verifica se o usuário existe e se é o administrador
    if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      isAuthorized = true
      log("Authorization successful: Admin user verified.", { userEmail: user.email });
    } else {
      log("Authorization failed: User is not admin or token is invalid.", { user: user ? user.email : 'not found' });
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  // --- FIM DO BLOCO DE AUTENTICAÇÃO ---

  if (!RESEND_API_KEY) {
    log("Configuration error: RESEND_API_KEY not found in secrets.");
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: corsHeaders })
  }
  log("RESEND_API_KEY found.");

  try {
    const { to, subject, html } = await req.json()
    log("Request body parsed:", { to, subject });

    if (!to || !subject || !html) {
      log("Validation error: Missing parameters.");
      return new Response(JSON.stringify({ error: 'Missing parameters: to, subject, html' }), { status: 400, headers: corsHeaders })
    }

    log("Sending request to Resend API...");
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
    log("Resend API response status:", resendResponse.status);

    if (!resendResponse.ok) {
      log("Resend API Error (Details):", data); // Log mais detalhado
      throw new Error(data.message || 'Failed to send email')
    }

    log("Email sent successfully via Resend.");
    return new Response(JSON.stringify({ success: true, data }), { headers: corsHeaders, status: 200 })

  } catch (error) {
    log("Edge Function execution error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 })
  }
})