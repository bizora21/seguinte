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
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`;
            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json();

            if (tokenData.error) {
                log("Erro Facebook Token:", tokenData.error);
                return new Response(JSON.stringify({ success: false, error: tokenData.error.message }), { status: 200, headers: corsHeaders });
            }

            const longUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
            const longResp = await fetch(longUrl);
            const longData = await longResp.json();
            
            userAccessToken = longData.access_token || tokenData.access_token;
            expiresIn = longData.expires_in || tokenData.expires_in;

            // Busca inicial de metadados (apenas para registro, a seleção real será no frontend)
            const meResp = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${userAccessToken}`);
            const meData = await meResp.json();
            metadata = { user_id: meData.id, user_name: meData.name };
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
             return new Response(JSON.stringify({ error: "Erro ao salvar integração: " + error.message }), { status: 500, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: true, saved: data }), { headers: corsHeaders, status: 200 });
    }
    
    // --- NOVA AÇÃO: LISTAR PÁGINAS DISPONÍVEIS ---
    if (action === 'get_connected_pages') {
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', 'facebook')
            .single();
            
        if (!integration || integration.access_token === 'PENDENTE_DE_CONEXAO') {
            return new Response(JSON.stringify({ success: false, error: 'Não conectado' }), { headers: corsHeaders, status: 404 });
        }
        
        const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${integration.access_token}&limit=100`);
        const pagesData = await pagesResp.json();
        
        if (pagesData.error) {
             return new Response(JSON.stringify({ success: false, error: "Erro Facebook: " + pagesData.error.message }), { status: 200, headers: corsHeaders });
        }

        const pages = pagesData.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            access_token: p.access_token // Importante: O token da página é retornado aqui para uso imediato se necessário, mas idealmente gerenciado pelo backend
        }));
        
        return new Response(JSON.stringify({ success: true, pages }), { headers: corsHeaders, status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { headers: corsHeaders, status: 400 });

  } catch (err) {
    log("Exceção:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders, status: 200 });
  }
});