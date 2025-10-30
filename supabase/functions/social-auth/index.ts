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
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usar SERVICE_ROLE_KEY para operações de escrita seguras
  {
    auth: {
      persistSession: false,
    },
  },
)

// Helper para logar no console com timestamp
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
  log("=== CALLBACK RECEBIDO ===");

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  // O Meta usa 'platform', o Google usa 'state' (que contém a plataforma)
  let platform = url.searchParams.get('platform');
  const stateParam = url.searchParams.get('state');
  
  // URL de redirecionamento para o painel admin
  const REDIRECT_BASE = `${url.origin}/dashboard/admin/marketing?tab=settings`;

  if (error) {
    log("--- ERRO RETORNADO PELA PLATAFORMA EXTERNA ---");
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=${encodeURIComponent(errorDescription || error || 'Erro desconhecido')}`;
    return Response.redirect(adminUrl, 302);
  }

  if (!code) {
    log("--- ERRO: Código não encontrado ---");
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=Codigo nao encontrado`;
    return Response.redirect(adminUrl, 302);
  }
  
  // Tenta extrair a plataforma do parâmetro state (usado pelo Google)
  if (stateParam) {
      try {
          const stateData = JSON.parse(decodeURIComponent(stateParam));
          platform = stateData.platform;
      } catch (e) {
          log("Erro ao decodificar state:", e);
      }
  }
  
  if (!platform) {
      log("--- ERRO: Plataforma não identificada ---");
      const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=Plataforma nao identificada`;
      return Response.redirect(adminUrl, 302);
  }

  log(`--- INICIANDO TROCA DE CÓDIGO PARA PLATAFORMA: ${platform} ---`);

  try {
    // 1. Obter o ID do Usuário (Admin) para salvar o token
    const ADMIN_EMAIL = 'lojarapidamz@outlook.com';
    const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .single();

    if (profileError || !adminProfile) {
        throw new Error('Perfil do administrador não encontrado no banco de dados.');
    }
    const adminId = adminProfile.id;
    
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let tokenType: string = 'user_token';
    
    // A URI de redirecionamento DEVE ser a URL desta Edge Function
    const redirectUri = `${url.origin}${url.pathname}`; 
    const encodedRedirectUri = encodeURIComponent(redirectUri);

    if (platform === 'facebook') {
        // --- Lógica Facebook ---
        // @ts-ignore
        const appId = Deno.env.get('FACEBOOK_APP_ID');
        // @ts-ignore
        const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
        
        // O Facebook exige que o parâmetro 'platform' esteja no redirect_uri para a troca de código
        const facebookRedirectUri = `${url.origin}${url.pathname}?platform=facebook`;
        const encodedFacebookRedirectUri = encodeURIComponent(facebookRedirectUri);

        const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodedFacebookRedirectUri}&code=${code}`);
        
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error?.message || 'Falha na troca do token de acesso do Facebook.');
        }

        accessToken = tokenData.access_token;
        expiresIn = tokenData.expires_in;
        tokenType = 'facebook_short_lived_user_token';
        
    } else if (platform.startsWith('google_')) {
        // --- Lógica Google (Analytics / Search Console) ---
        // @ts-ignore
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        // @ts-ignore
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri, // Google usa o URI sem parâmetros de consulta
                grant_type: 'authorization_code',
            }).toString(),
        });
        
        const tokenData = await tokenResponse.json();
        log("Resposta da API de Token do Google:", tokenData);

        if (!tokenResponse.ok || tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error || 'Falha na troca do token de acesso do Google.');
        }
        
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token || null; // Refresh token é crucial para acesso offline
        expiresIn = tokenData.expires_in;
        tokenType = 'google_access_token';
        
    } else {
        throw new Error('Plataforma de integração não suportada.');
    }
    
    // 3. Calcular a data de expiração
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    // 4. Salvar o Token na tabela 'integrations'
    const { error: insertError } = await supabase
        .from('integrations')
        .upsert({
            platform: platform,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            metadata: {
                user_id: adminId,
                token_type: tokenType,
                // Adicionar qualquer metadado específico da plataforma aqui
            }
        }, { onConflict: 'platform' })
        .select();

    if (insertError) {
        throw new Error('Erro ao salvar token no banco de dados: ' + insertError.message);
    }

    log("--- SUCESSO! TOKEN SALVO ---");
    
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-success&platform=${platform}`;
    return Response.redirect(adminUrl, 302);

  } catch (err) {
    log("--- ERRO EXCEÇÃO DURANTE O PROCESSO ---");
    // @ts-ignore
    log(err.message);
    // @ts-ignore
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=${encodeURIComponent(err.message || 'Erro inesperado na Edge Function')}`;
    return Response.redirect(adminUrl, 302);
  }
});