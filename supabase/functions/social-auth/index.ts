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

// Cliente Admin GLOBAL para logs
// @ts-ignore
const getDb = () => createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// Helper de Log no Banco
// @ts-ignore
const dbLog = async (level: string, message: string, details?: any) => {
  try {
    const supabase = getDb();
    console.log(`[${level}] ${message}`, details || '');
    await supabase.from('system_logs').insert({
      service: 'social-auth',
      level,
      message,
      details: details ? details : null
    });
  } catch (e) {
    console.error("Falha ao gravar log no DB:", e);
  }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabaseAdmin = getDb();
    const reqBody = await req.json()
    const { action, code, platform, redirect_uri } = reqBody
    
    // --- ROTA DE TESTE (NOVO) ---
    if (action === 'ping') {
        await dbLog('info', 'PING RECEBIDO: O sistema de logs está funcionando!', { time: new Date().toISOString() });
        return new Response(JSON.stringify({ success: true, message: 'Pong!' }), { headers: corsHeaders, status: 200 });
    }

    await dbLog('info', `Ação iniciada: ${action}`, { platform, redirect_uri_provided: !!redirect_uri });

    // --- AÇÃO 1: TROCA DE TOKEN (CALLBACK DO OAUTH) ---
    if (action === 'exchange_token') {
        const cleanPlatform = (platform || 'facebook').toLowerCase().trim();
        
        if (!code) throw new Error("Parâmetro 'code' ausente.");
        if (!redirect_uri) throw new Error("Parâmetro 'redirect_uri' ausente.");

        let userAccessToken = '';
        let expiresIn = null;
        let metadata: any = { connected_at: new Date().toISOString() };

        if (cleanPlatform === 'facebook') {
            await dbLog('info', "Iniciando troca de code com Facebook...", { redirect_uri });
            
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`;
            
            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json();

            if (tokenData.error) {
                await dbLog('error', "Facebook recusou o code", tokenData.error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: `Facebook Error: ${tokenData.error.message}`,
                    details: tokenData.error
                }), { status: 200, headers: corsHeaders });
            }

            await dbLog('info', "Token curto obtido. Trocando por longo...");

            const longUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
            const longResp = await fetch(longUrl);
            const longData = await longResp.json();
            
            userAccessToken = longData.access_token || tokenData.access_token;
            expiresIn = longData.expires_in || tokenData.expires_in;

            // BUSCAR DADOS DO USUÁRIO
            const meResp = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,accounts{access_token,name,id,category}&access_token=${userAccessToken}`);
            const meData = await meResp.json();
            
            if (meData.error) {
                await dbLog('error', "Erro ao buscar perfil do usuário", meData.error);
            } else {
                metadata.user_id = meData.id;
                metadata.user_name = meData.name;
                
                if (meData.accounts && meData.accounts.data.length > 0) {
                    const firstPage = meData.accounts.data[0];
                    metadata.page_id = firstPage.id;
                    metadata.page_name = firstPage.name;
                    metadata.total_pages = meData.accounts.data.length;
                } else {
                    metadata.warning = "Nenhuma página encontrada.";
                }
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
             await dbLog('error', "Erro ao salvar no Supabase", error);
             return new Response(JSON.stringify({ success: false, error: "Erro de Banco de Dados: " + error.message }), { status: 200, headers: corsHeaders });
        }

        await dbLog('info', "Conexão salva com sucesso!", { id: data.id });
        return new Response(JSON.stringify({ success: true, saved: data }), { headers: corsHeaders, status: 200 });
    }
    
    // ... (restante do código mantido igual)
    if (action === 'get_connected_pages') {
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', 'facebook')
            .single();
            
        if (!integration || integration.access_token === 'PENDENTE_DE_CONEXAO') {
            return new Response(JSON.stringify({ success: false, error: 'Não conectado.' }), { headers: corsHeaders, status: 200 });
        }
        
        const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${integration.access_token}&limit=100`);
        const pagesData = await pagesResp.json();
        
        if (pagesData.error) {
             return new Response(JSON.stringify({ success: false, error: pagesData.error.message }), { status: 200, headers: corsHeaders });
        }

        const pages = pagesData.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            access_token: p.access_token
        }));
        
        return new Response(JSON.stringify({ success: true, pages }), { headers: corsHeaders, status: 200 });
    }

    if (action === 'fetch_pages') {
         return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida.' }), { headers: corsHeaders, status: 400 });

  } catch (err) {
    await dbLog('error', "Exceção não tratada", { message: err.message, stack: err.stack });
    return new Response(JSON.stringify({ success: false, error: err.message || "Erro interno no servidor." }), { headers: corsHeaders, status: 200 });
  }
});