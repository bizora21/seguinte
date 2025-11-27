// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Credenciais Hardcoded (Verifique se estão corretas no Painel do Facebook)
const FB_APP_ID = '705882238650821'
const FB_APP_SECRET = '9ed8f8cba18684539e3aa675a13c788c'

// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[SOCIAL-AUTH] ${message}`, data ? JSON.stringify(data) : '');
}

// @ts-ignore
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // --- 1. AUTENTICAÇÃO ---
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  
  const token = authHeader.replace('Bearer ', '')
  const supabaseClient = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: corsHeaders })
  }
  
  // Apenas Admin pode conectar contas globais
  const ADMIN_EMAIL = 'lojarapidamz@outlook.com';
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Apenas o administrador pode gerenciar integrações.' }), { status: 403, headers: corsHeaders })
  }
  
  // Cliente Admin para DB
  const supabaseAdmin = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { action, code, platform, redirect_uri } = await req.json()

    // --- AÇÃO 1: TROCA DE TOKEN (LOGIN) ---
    if (action === 'exchange_token') {
        log(`Iniciando troca de token. Plataforma: ${platform}`);
        
        let accessToken: string;
        let expiresIn: number | null = null;
        let tokenType: string = 'user_token';
        let metadata: any = { user_id: user.id };

        if (platform === 'facebook') {
            // 1. Trocar Code por Short-Lived Token
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`;
            
            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json();

            if (tokenData.error) {
                log("Erro FB Token:", tokenData.error);
                return new Response(JSON.stringify({ 
                    error: `Facebook recusou a conexão: ${tokenData.error.message}`,
                    details: tokenData.error 
                }), { status: 400, headers: corsHeaders });
            }

            accessToken = tokenData.access_token;
            expiresIn = tokenData.expires_in;

            // 2. Trocar Short-Lived por Long-Lived Token (Dura 60 dias)
            const longUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`;
            const longResp = await fetch(longUrl);
            const longData = await longResp.json();
            
            if (longData.access_token) {
                accessToken = longData.access_token;
                expiresIn = longData.expires_in; 
                tokenType = 'facebook_long_lived_token';
                log("Token de longa duração obtido com sucesso.");
            }

            // 3. Buscar Páginas Automaticamente
            const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
            const pagesData = await pagesResp.json();
            
            if (pagesData.data && pagesData.data.length > 0) {
                const page = pagesData.data[0]; // Pega a primeira página
                metadata.page_id = page.id;
                metadata.page_name = page.name;
                metadata.page_access_token = page.access_token;
                log(`Página encontrada: ${page.name}`);
            }
        } 
        
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        // 4. Salvar no Banco (UPSERT - Atualiza se existir, Cria se não)
        // Isso previne erros de constraint UNIQUE
        const { error: dbError } = await supabaseAdmin
            .from('integrations')
            .upsert({
                platform: platform,
                access_token: accessToken,
                expires_at: expiresAt,
                metadata: { ...metadata, token_type: tokenType },
                updated_at: new Date().toISOString()
            }, { onConflict: 'platform' });

        if (dbError) {
             log("Erro DB Upsert:", dbError);
             return new Response(JSON.stringify({ error: "Erro ao salvar no banco de dados.", details: dbError }), { status: 500, headers: corsHeaders });
        }

        log("Integração salva com sucesso.");
        return new Response(JSON.stringify({ success: true, platform }), { headers: corsHeaders, status: 200 });
    }

    // --- AÇÃO 2: BUSCAR PÁGINAS ---
    if (action === 'fetch_pages') {
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', 'facebook')
            .single();
            
        if (!integration) {
            return new Response(JSON.stringify({ error: 'Conta não conectada.' }), { headers: corsHeaders, status: 404 });
        }
        
        const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${integration.access_token}`);
        const pagesData = await pagesResp.json();
        
        if (pagesData.error) {
            return new Response(JSON.stringify({ error: pagesData.error.message }), { headers: corsHeaders, status: 400 });
        }
        
        if (pagesData.data && pagesData.data.length > 0) {
             const page = pagesData.data[0];
             const updatedMeta = { 
                 ...integration.metadata, 
                 page_id: page.id, 
                 page_name: page.name, 
                 page_access_token: page.access_token 
             };
             
             await supabaseAdmin.from('integrations')
                .update({ metadata: updatedMeta })
                .eq('id', integration.id);
                
             return new Response(JSON.stringify({ success: true, page_name: page.name }), { headers: corsHeaders, status: 200 });
        } else {
            return new Response(JSON.stringify({ success: false, message: 'Nenhuma página encontrada.' }), { headers: corsHeaders, status: 200 });
        }
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { headers: corsHeaders, status: 400 });

  } catch (err) {
    log("ERRO CRÍTICO:", err);
    return new Response(JSON.stringify({ error: `Erro interno: ${err.message}` }), { headers: corsHeaders, status: 500 });
  }
});