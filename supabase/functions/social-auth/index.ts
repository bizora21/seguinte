// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

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
  log("URL completa:", url.href);
  log("Método:", req.method);
  log("Headers:", Object.fromEntries(req.headers.entries()));

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorReason = url.searchParams.get('error_reason');
  const errorDescription = url.searchParams.get('error_description');

  // URL de redirecionamento para o painel admin (ajustada para o seu projeto)
  const REDIRECT_BASE = `${req.headers.get('origin')}/dashboard/admin/marketing?tab=settings`;

  if (error) {
    log("--- ERRO RETORNADO PELA PLATAFORMA EXTERNA ---");
    log("Error:", error);
    log("Reason:", errorReason);
    log("Description:", errorDescription);
    
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=${encodeURIComponent(errorDescription || error || 'Erro desconhecido')}`;
    return Response.redirect(adminUrl, 302);
  }

  if (!code) {
    log("--- ERRO: Código de autorização não encontrado na URL ---");
    const adminUrl = `${REDIRECT_BASE}&status=social-auth-error&message=Codigo de autorizacao nao encontrado`;
    return Response.redirect(adminUrl, 302);
  }

  log("--- TROCANDO CÓDIGO PELO TOKEN DE ACESSO ---");
  log("Código recebido:", code);

  // @ts-ignore
  const appId = Deno.env.get('FACEBOOK_APP_ID');
  // @ts-ignore
  const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
  
  // A URI de redirecionamento DEVE ser a URL desta Edge Function, incluindo o parâmetro 'platform'
  // O parâmetro 'platform' é necessário para o fluxo de conexão inicial, mas não para a troca de token do Facebook.
  // No entanto, para garantir que a URI seja idêntica à cadastrada no Meta, usamos a URL completa do callback.
  const platform = url.searchParams.get('platform');
  const redirectUri = `${url.origin}${url.pathname}?platform=${platform}`; 
  const encodedRedirectUri = encodeURIComponent(redirectUri);

  log("Configurações usadas para a troca:", { appId, redirectUri, appSecret: appSecret ? 'OK' : 'MISSING' });

  try {
    const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodedRedirectUri}&code=${code}`);
    
    const tokenData = await tokenResponse.json();
    log("Resposta da API de Token:", tokenData);

    if (!tokenResponse.ok || tokenData.error) {
      log("--- ERRO NA TROCA DO TOKEN ---");
      throw new Error(tokenData.error_description || tokenData.error?.message || 'Falha na troca do token de acesso.');
    }

    log("--- SUCESSO! TOKEN OBTIDO ---");
    
    // Neste ponto, você faria a lógica de salvar o token no banco de dados.
    // Como este é um passo de diagnóstico, vamos apenas redirecionar para sucesso.

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