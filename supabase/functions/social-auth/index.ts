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

    if (action === 'exchange_token') {
        let accessToken = '';
        let expiresIn = null;
        let metadata: any = {};

        if (platform === 'facebook') {
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`;
            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json();

            if (tokenData.error) return new Response(JSON.stringify({ error: tokenData.error.message }), { status: 400, headers: corsHeaders });

            accessToken = tokenData.access_token;
            expiresIn = tokenData.expires_in;

            // Long-Lived Token
            const longUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`;
            const longResp = await fetch(longUrl);
            const longData = await longResp.json();
            
            if (longData.access_token) {
                accessToken = longData.access_token;
                expiresIn = longData.expires_in;
            }

            // Buscar Páginas
            const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
            const pagesData = await pagesResp.json();
            
            if (pagesData.data && pagesData.data.length > 0) {
                const page = pagesData.data[0];
                metadata.page_id = page.id;
                metadata.page_name = page.name;
                metadata.page_access_token = page.access_token;
            }
        } 
        
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        // SALVAR E RETORNAR DADOS
        const { data: savedData, error: dbError } = await supabaseAdmin
            .from('integrations')
            .upsert({
                platform: platform,
                access_token: accessToken,
                expires_at: expiresAt,
                metadata: metadata,
                updated_at: new Date().toISOString()
            })
            .select() // Importante: Retornar o dado salvo
            .single();

        if (dbError) {
             return new Response(JSON.stringify({ error: "Erro de banco de dados: " + dbError.message }), { status: 500, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: true, saved: savedData }), { headers: corsHeaders, status: 200 });
    }
    
    if (action === 'fetch_pages') {
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', 'facebook')
            .single();
            
        if (!integration) return new Response(JSON.stringify({ error: 'Não conectado' }), { headers: corsHeaders, status: 404 });
        
        return new Response(JSON.stringify({ success: true, page_name: integration.metadata?.page_name || 'Atualizado' }), { headers: corsHeaders, status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { headers: corsHeaders, status: 400 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 500 });
  }
});