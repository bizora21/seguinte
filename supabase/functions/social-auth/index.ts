// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const FB_APP_ID = '705882238650821'
const FB_APP_SECRET = '9ed8f8cba18684539e3aa675a13c788c'

// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[SOCIAL-AUTH] ${message}`, data ? JSON.stringify(data) : '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabaseAdmin = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
    )

    const { action, code, platform, redirect_uri } = await req.json()

    // --- AÇÃO PRINCIPAL: TROCA DE TOKEN (CALLBACK) ---
    if (action === 'exchange_token') {
        const cleanPlatform = (platform || 'facebook').toLowerCase().trim();
        log(`Iniciando troca de token para: ${cleanPlatform}`);
        
        let userAccessToken = '';
        let expiresIn = null;
        let metadata: any = {};

        if (cleanPlatform === 'facebook') {
            // 1. Obter Short-Lived User Token
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`;
            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json();

            if (tokenData.error) {
                log("Erro Facebook Token:", tokenData.error);
                // Retornar 200 com erro para o frontend ler
                return new Response(JSON.stringify({ success: false, error: tokenData.error.message }), { status: 200, headers: corsHeaders });
            }

            // 2. Trocar por Long-Lived User Token
            const longUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
            const longResp = await fetch(longUrl);
            const longData = await longResp.json();
            
            userAccessToken = longData.access_token || tokenData.access_token;
            expiresIn = longData.expires_in || tokenData.expires_in;

            // 3. CRÍTICO: Buscar Páginas e o PAGE ACCESS TOKEN
            log("Buscando páginas e tokens de página...");
            const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`);
            const pagesData = await pagesResp.json();
            
            if (pagesData.data && pagesData.data.length > 0) {
                const page = pagesData.data[0];
                metadata = {
                    user_id: page.id,
                    page_id: page.id,
                    page_name: page.name,
                    page_access_token: page.access_token,
                    category: page.category
                };
                log(`Página encontrada: ${page.name} (ID: ${page.id})`);
            } else {
                log("Nenhuma página encontrada vinculada a este usuário.");
            }
        } 
        
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        const { data, error } = await supabaseAdmin
            .from('integrations')
            .upsert({
                platform: cleanPlatform,
                access_token: userAccessToken,
                expires_at: expiresAt,
                metadata: metadata,
                updated_at: new Date().toISOString()
            }, { onConflict: 'platform' })
            .select()
            .single();

        if (error) {
             log("Erro no UPSERT:", error);
             return new Response(JSON.stringify({ success: false, error: "Erro ao salvar integração: " + error.message }), { status: 200, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: true, saved: data }), { headers: corsHeaders, status: 200 });
    }
    
    // --- AÇÃO SECUNDÁRIA: RENOVAR/SINCRONIZAR PÁGINAS ---
    if (action === 'fetch_pages') {
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', 'facebook')
            .single();
            
        if (!integration) {
            return new Response(JSON.stringify({ success: false, error: 'Não conectado' }), { headers: corsHeaders, status: 200 });
        }
        
        // Verifica se é placeholder
        if (integration.access_token === 'PENDENTE_DE_CONEXAO') {
             return new Response(JSON.stringify({ success: false, error: 'Conexão pendente. Por favor, conecte novamente.' }), { headers: corsHeaders, status: 200 });
        }
        
        const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${integration.access_token}`);
        const pagesData = await pagesResp.json();
        
        if (pagesData.error) {
             // Retorna 200 com detalhe do erro
             return new Response(JSON.stringify({ success: false, error: "Erro Facebook: " + pagesData.error.message }), { status: 200, headers: corsHeaders });
        }

        let updatedMetadata = integration.metadata || {};
        let pageName = 'Nenhuma';

        if (pagesData.data && pagesData.data.length > 0) {
            const page = pagesData.data[0];
            updatedMetadata.page_id = page.id;
            updatedMetadata.page_name = page.name;
            updatedMetadata.page_access_token = page.access_token;
            pageName = page.name;
            
            await supabaseAdmin
                .from('integrations')
                .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
                .eq('platform', 'facebook');
        } else {
            return new Response(JSON.stringify({ success: false, error: "Nenhuma página do Facebook encontrada nesta conta." }), { headers: corsHeaders, status: 200 });
        }
        
        return new Response(JSON.stringify({ success: true, page_name: pageName }), { headers: corsHeaders, status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { headers: corsHeaders, status: 400 });

  } catch (err) {
    log("Exceção:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders, status: 200 });
  }
});