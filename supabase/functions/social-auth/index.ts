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
  const platform = url.searchParams.get('platform');

  // URL de redirecionamento para o painel admin
  const REDIRECT_BASE = `${url.origin}/dashboard/admin/marketing?tab=settings`;

  if (error) {
    log("--- ERRO RETORNADO PELA PLATAFORMA EXTERNA ---");
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=${encodeURIComponent(errorDescription || error || 'Erro desconhecido')}`;
    return Response.redirect(adminUrl, 302);
  }

  if (!code || !platform) {
    log("--- ERRO: Código ou plataforma não encontrados ---");
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=Codigo ou plataforma nao encontrados`;
    return Response.redirect(adminUrl, 302);
  }

  log("--- TROCANDO CÓDIGO PELO TOKEN DE ACESSO ---");

  // @ts-ignore
  const appId = Deno.env.get('FACEBOOK_APP_ID');
  // @ts-ignore
  const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
  
  // A URI de redirecionamento DEVE ser a URL desta Edge Function, incluindo o parâmetro 'platform'
  const redirectUri = `${url.origin}${url.pathname}?platform=${platform}`; 
  const encodedRedirectUri = encodeURIComponent(redirectUri);

  try {
    // 1. Troca do Código pelo Token de Acesso
    const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodedRedirectUri}&code=${code}`);
    
    const tokenData = await tokenResponse.json();
    log("Resposta da API de Token:", tokenData);

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error?.message || 'Falha na troca do token de acesso.');
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in; // Tempo de vida do token em segundos
    
    // 2. Obter o ID do Usuário (Admin) para salvar o token
    // Nota: O token de acesso retornado aqui é um token de usuário de curto prazo.
    // Para um aplicativo real, você precisaria trocá-lo por um token de página de longo prazo.
    // Por enquanto, vamos salvar o token de usuário de curto prazo e o ID do Admin.
    
    // O ID do usuário (Admin) deve ser obtido de forma segura.
    // Como estamos usando o SERVICE_ROLE_KEY, podemos buscar o perfil do admin diretamente.
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
    
    // 3. Calcular a data de expiração
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 4. Salvar o Token na tabela 'integrations'
    const { error: insertError } = await supabase
        .from('integrations')
        .upsert({
            platform: platform,
            access_token: accessToken,
            expires_at: expiresAt,
            metadata: {
                // Aqui você salvaria dados adicionais, como ID da página, ID do Instagram, etc.
                user_id: adminId,
                token_type: 'short_lived_user_token'
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