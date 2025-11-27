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
const log = (message: string, data?: any) => {
  console.log(`[SOCIAL-AUTH-LOG - ${new Date().toISOString()}] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // --- AUTHENTICATION CHECK ---
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
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
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user' }), { status: 401, headers: corsHeaders })
  }
  
  const ADMIN_EMAIL = 'lojarapidamz@outlook.com';
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 403, headers: corsHeaders })
  }
  
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
        log(`Processing token exchange for ${platform}`);
        
        let accessToken: string;
        let refreshToken: string | null = null;
        let expiresIn: number | null = null;
        let tokenType: string = 'user_token';
        let metadata: any = { user_id: user.id };

        if (platform === 'facebook') {
            const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`);
            
            const tokenData = await tokenResponse.json();
            if (!tokenResponse.ok || tokenData.error) {
                log("Erro Facebook Token:", tokenData);
                throw new Error(tokenData.error?.message || 'Falha na troca do token Facebook.');
            }

            accessToken = tokenData.access_token;
            expiresIn = tokenData.expires_in; 
            
            const longLivedResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`);
            const longLivedData = await longLivedResponse.json();
            
            if (longLivedData.access_token) {
                accessToken = longLivedData.access_token;
                expiresIn = longLivedData.expires_in; 
                tokenType = 'facebook_long_lived_token';
            }

            // Tenta buscar páginas imediatamente
            const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
            const pagesData = await pagesResp.json();
            
            if (pagesData.data && pagesData.data.length > 0) {
                const page = pagesData.data[0];
                metadata.page_id = page.id;
                metadata.page_name = page.name;
                metadata.page_access_token = page.access_token;
                log("Página encontrada:", page.name);
            }
        } 
        
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        // Limpeza prévia: Remove duplicatas antigas para evitar erros de constraint, se existirem
        await supabaseAdmin.from('integrations').delete().eq('platform', platform);

        const { error: insertError } = await supabaseAdmin
            .from('integrations')
            .insert({
                platform: platform,
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                metadata: { ...metadata, token_type: tokenType },
                updated_at: new Date().toISOString()
            });

        if (insertError) throw new Error("Erro ao salvar no banco: " + insertError.message);

        return new Response(JSON.stringify({ success: true, platform }), { headers: corsHeaders, status: 200 });
    }

    // --- AÇÃO 2: SINCRONIZAR PÁGINAS ---
    if (action === 'fetch_pages') {
        // Busca a integração mais recente (caso haja duplicatas, pega a última)
        const { data: integrations, error: dbError } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', 'facebook')
            .order('updated_at', { ascending: false })
            .limit(1);
            
        if (dbError) {
            console.error("DB Error:", dbError);
            throw new Error('Erro ao consultar banco de dados.');
        }

        const integration = integrations?.[0];
            
        if (!integration) {
            return new Response(JSON.stringify({ success: false, error: 'Nenhuma conta do Facebook conectada.' }), { headers: corsHeaders, status: 404 });
        }
        
        const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${integration.access_token}`);
        const pagesData = await pagesResp.json();
        
        if (pagesData.error) {
            console.error("FB API Error:", pagesData.error);
            
            if (pagesData.error.code === 190) {
                 return new Response(JSON.stringify({ success: false, message: 'Seu token do Facebook expirou. Por favor, clique em "Reconectar Conta".' }), { headers: corsHeaders, status: 200 });
            }
            
            return new Response(JSON.stringify({ success: false, message: `Erro do Facebook: ${pagesData.error.message}` }), { headers: corsHeaders, status: 200 });
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
                .eq('id', integration.id); // Usa ID específico para evitar update múltiplo
                
             return new Response(JSON.stringify({ success: true, page_name: page.name }), { headers: corsHeaders, status: 200 });
        } else {
            return new Response(JSON.stringify({ success: false, message: 'Nenhuma Página do Facebook encontrada nesta conta. Crie uma página no Facebook primeiro.' }), { headers: corsHeaders, status: 200 });
        }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { headers: corsHeaders, status: 400 });

  } catch (err) {
    log("ERRO CRÍTICO:", err);
    // Retornar 200 com erro no corpo para que o frontend possa ler a mensagem
    return new Response(JSON.stringify({ success: false, error: err.message || 'Erro interno no servidor' }), { headers: corsHeaders, status: 200 });
  }
});