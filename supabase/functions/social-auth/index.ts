// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Credenciais Hardcoded
const FB_APP_ID = '705882238650821'
const FB_APP_SECRET = '9ed8f8cba18684539e3aa675a13c788c'

// @ts-ignore
const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[SOCIAL-AUTH-LOG - ${new Date().toISOString()}] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // Endpoint de Configuração
  if (req.method === 'GET' && action === 'get_config') {
      // @ts-ignore
      const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
      return new Response(JSON.stringify({ 
          facebook_app_id: FB_APP_ID,
          google_client_id: googleClientId
      }), { headers: corsHeaders, status: 200 });
  }

  // --- LÓGICA DE CALLBACK (OAUTH) ---
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  let platform = url.searchParams.get('platform');
  const stateParam = url.searchParams.get('state');
  
  const REDIRECT_BASE = `${url.origin}/dashboard/admin/marketing?tab=settings`;

  if (error) {
    log("--- ERRO RETORNADO PELA PLATAFORMA EXTERNA ---");
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=${encodeURIComponent(errorDescription || error || 'Erro desconhecido')}`;
    return Response.redirect(adminUrl, 302);
  }

  if (stateParam) {
      try {
          const stateData = JSON.parse(decodeURIComponent(stateParam));
          // Recuperar a plataforma do state se não vier na URL
          if (!platform && stateData.platform) {
              platform = stateData.platform;
          }
      } catch (e) {
          log("Erro ao decodificar state:", e);
      }
  }

  if (!code || !platform) {
      return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), { status: 400, headers: corsHeaders });
  }

  log(`--- INICIANDO TROCA DE CÓDIGO PARA PLATAFORMA: ${platform} ---`);

  try {
    const ADMIN_EMAIL = 'lojarapidamz@outlook.com';
    const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .single();

    if (profileError || !adminProfile) {
        throw new Error('Perfil do administrador não encontrado.');
    }
    const adminId = adminProfile.id;
    
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let tokenType: string = 'user_token';
    let metadata: any = { user_id: adminId };
    
    // URL DE REDIRECIONAMENTO LIMPA (Crucial: deve ser idêntica à cadastrada no Facebook)
    let redirectUri = `${url.origin}${url.pathname}`; 

    if (platform === 'facebook') {
        // NÃO adicionar query params aqui, pois removemos no frontend também
        // redirectUri já está limpa
        
        const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
        
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || tokenData.error) {
            log("Erro Facebook Token:", tokenData);
            throw new Error(tokenData.error?.message || 'Falha na troca do token Facebook.');
        }

        accessToken = tokenData.access_token;
        expiresIn = tokenData.expires_in; 
        
        // Troca para Long-Lived Token
        const longLivedResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`);
        const longLivedData = await longLivedResponse.json();
        
        if (longLivedData.access_token) {
            accessToken = longLivedData.access_token;
            expiresIn = longLivedData.expires_in;
            tokenType = 'facebook_long_lived_token';
        }

        // Buscar Páginas
        const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesResp.json();
        
        if (pagesData.data && pagesData.data.length > 0) {
            const page = pagesData.data[0];
            metadata.page_id = page.id;
            metadata.page_name = page.name;
            metadata.page_access_token = page.access_token;
            log("Página do Facebook encontrada:", page.name);
        }

    } else if (platform.startsWith('google_')) {
        // Código Google mantido...
        // @ts-ignore
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        // @ts-ignore
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }).toString(),
        });
        
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Falha token Google');
        
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token;
        expiresIn = tokenData.expires_in;
        tokenType = 'google_access_token';
    } else {
        throw new Error('Plataforma não suportada.');
    }
    
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { error: insertError } = await supabase
        .from('integrations')
        .upsert({
            platform: platform,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            metadata: { ...metadata, token_type: tokenType }
        }, { onConflict: 'platform' });

    if (insertError) throw new Error(insertError.message);

    log("--- SUCESSO! ---");
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-success&platform=${platform}`;
    return Response.redirect(adminUrl, 302);

  } catch (err) {
    log("ERRO CRÍTICO:", err);
    // @ts-ignore
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=${encodeURIComponent(err.message)}`;
    return Response.redirect(adminUrl, 302);
  }
});