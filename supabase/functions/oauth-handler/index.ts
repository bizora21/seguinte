// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Inicializa o cliente Supabase (para interagir com o banco de dados)
// @ts-ignore
const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // USANDO SERVICE ROLE KEY
  {
    auth: {
      persistSession: false,
    },
  },
)

// URL de redirecionamento após o OAuth (deve ser a URL do seu frontend)
const REDIRECT_URL_SUCCESS = 'https://lojarapidamz.com/dashboard/admin/marketing?tab=settings&status=success'
const REDIRECT_URL_FAILURE = 'https://lojarapidamz.com/dashboard/admin/marketing?tab=settings&status=failure'

// Credenciais reais (obtidas dos Secrets do Supabase)
// @ts-ignore
const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID')
// @ts-ignore
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET')
// @ts-ignore
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
// @ts-ignore
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const url = new URL(req.url)
  const platform = url.searchParams.get('platform')
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')

  if (error) {
    console.error("--- ERRO RETORNADO PELA PLATAFORMA EXTERNA ---");
    console.error("Error:", error);
    console.error("Description:", errorDescription);
    
    return Response.redirect(`${REDIRECT_URL_FAILURE}&message=${encodeURIComponent(errorDescription || error)}`, 302)
  }

  if (!platform || !code) {
    return Response.redirect(`${REDIRECT_URL_FAILURE}&message=Missing platform or code`, 302)
  }

  try {
    let tokenData: any = null
    let metadata: any = {}
    let tokenEndpoint = ''
    let clientId = ''
    let clientSecret = ''
    
    // A URL de redirecionamento DEVE ser a URL desta Edge Function, incluindo o parâmetro 'platform'
    // Ex: https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/oauth-handler?platform=facebook
    const redirectUriForTokenExchange = `${url.origin}${url.pathname}?platform=${platform}` 

    if (platform === 'facebook') {
      clientId = FACEBOOK_APP_ID
      clientSecret = FACEBOOK_APP_SECRET
      
      if (!clientId || !clientSecret) throw new Error('Facebook Secrets not configured in Supabase.')
      
      // Endpoint para trocar o código por token
      tokenEndpoint = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUriForTokenExchange}&client_secret=${clientSecret}&code=${code}`
      
      // 1. Trocar código por token
      const tokenResponse = await fetch(tokenEndpoint, { method: 'GET' })
      tokenData = await tokenResponse.json()
      
      if (tokenData.error) throw new Error(tokenData.error.message)
      
      // 2. Obter informações da página/usuário (simulação)
      // Em um cenário real, você faria chamadas adicionais aqui para obter o ID da página e o token de acesso de longa duração.
      metadata = { page_name: 'LojaRápida MZ', instagram_account: '@lojarapida_mz' }

    } else if (platform.startsWith('google')) {
      clientId = GOOGLE_CLIENT_ID
      clientSecret = GOOGLE_CLIENT_SECRET
      
      if (!clientId || !clientSecret) throw new Error('Google Secrets not configured in Supabase.')
      
      tokenEndpoint = 'https://oauth2.googleapis.com/token'
      
      // 1. Trocar código por token
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUriForTokenExchange, 
          grant_type: 'authorization_code',
        }),
      })
      tokenData = await tokenResponse.json()
      
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error)
      
      // 2. Obter informações da conta (simulação)
      metadata = { property_id: 'GA-12345', view_id: '98765' }
    } else {
        throw new Error('Plataforma não suportada.')
    }

    // 3. Salvar token na tabela 'integrations' (usando Service Role Key)
    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        platform: platform,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        metadata: metadata,
        updated_at: new Date().toISOString()
      }, { onConflict: 'platform' })

    if (dbError) throw dbError

    return Response.redirect(`${REDIRECT_URL_SUCCESS}&platform=${platform}`, 302)

  } catch (error) {
    console.error('OAuth Processing Error:', error)
    return Response.redirect(`${REDIRECT_URL_FAILURE}&message=${encodeURIComponent(error.message || 'Unknown error')}`, 302)
  }
})