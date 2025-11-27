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
  console.log(`[SOCIAL-AUTH-DEBUG] ${message}`, data ? JSON.stringify(data) : '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Cliente Admin para ignorar RLS se necessário, mas preferimos usar o contexto do usuário quando possível
    const supabaseAdmin = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
    )

    const reqBody = await req.json()
    const { action, code, platform, redirect_uri } = reqBody
    
    log(`Ação recebida: ${action}`, { platform, redirect_uri_provided: !!redirect_uri });

    // --- AÇÃO 1: TROCA DE TOKEN (CALLBACK DO OAUTH) ---
    if (action === 'exchange_token') {
        const cleanPlatform = (platform || 'facebook').toLowerCase().trim();
        
        if (!code) throw new Error("Parâmetro 'code' ausente.");
        if (!redirect_uri) throw new Error("Parâmetro 'redirect_uri' ausente.");

        let userAccessToken = '';
        let expiresIn = null;
        let metadata: any = { connected_at: new Date().toISOString() };

        if (cleanPlatform === 'facebook') {
            log("Iniciando troca de code com Facebook Graph API...");
            
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`;
            
            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json();

            if (tokenData.error) {
                log("ERRO CRÍTICO Facebook Token:", tokenData.error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: `Facebook recusou a conexão: ${tokenData.error.message}`,
                    details: tokenData.error
                }), { status: 200, headers: corsHeaders });
            }

            log("Token de curta duração obtido. Trocando por longa duração...");

            const longUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
            const longResp = await fetch(longUrl);
            const longData = await longResp.json();
            
            userAccessToken = longData.access_token || tokenData.access_token;
            expiresIn = longData.expires_in || tokenData.expires_in;

            // BUSCAR DADOS DO USUÁRIO E PÁGINAS IMEDIATAMENTE
            log("Buscando perfil e páginas do usuário...");
            const meResp = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,accounts{access_token,name,id,category}&access_token=${userAccessToken}`);
            const meData = await meResp.json();
            
            if (meData.error) {
                log("Erro ao buscar perfil:", meData.error);
            } else {
                metadata.user_id = meData.id;
                metadata.user_name = meData.name;
                
                // Se tiver páginas, salvar a primeira como default nos metadados para evitar PAGE_NOT_SELECTED
                if (meData.accounts && meData.accounts.data.length > 0) {
                    const firstPage = meData.accounts.data[0];
                    metadata.page_id = firstPage.id;
                    metadata.page_name = firstPage.name;
                    metadata.page_access_token = firstPage.access_token;
                    metadata.total_pages = meData.accounts.data.length;
                    log(`Página padrão definida: ${firstPage.name}`);
                } else {
                    log("AVISO: Usuário não tem páginas ou não deu permissão 'pages_show_list'.");
                    metadata.warning = "Nenhuma página encontrada via API.";
                }
            }
        } 
        
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        log("Salvando no banco de dados...");
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
             log("ERRO DB Upsert:", error);
             return new Response(JSON.stringify({ success: false, error: "Erro de Banco de Dados: " + error.message }), { status: 200, headers: corsHeaders });
        }

        log("Integração salva com sucesso!", { id: data.id });
        return new Response(JSON.stringify({ success: true, saved: data }), { headers: corsHeaders, status: 200 });
    }
    
    // --- AÇÃO 2: LISTAR PÁGINAS (FRONTEND USA ISSO) ---
    if (action === 'get_connected_pages') {
        log("Buscando páginas conectadas...");
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', 'facebook')
            .single();
            
        if (!integration || integration.access_token === 'PENDENTE_DE_CONEXAO') {
            return new Response(JSON.stringify({ success: false, error: 'Integração não encontrada ou pendente.' }), { headers: corsHeaders, status: 200 });
        }
        
        const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${integration.access_token}&limit=100`);
        const pagesData = await pagesResp.json();
        
        if (pagesData.error) {
             log("Erro Facebook Graph:", pagesData.error);
             // Tentar invalidar o token se for erro de sessão
             if (pagesData.error.code === 190) {
                 await supabaseAdmin.from('integrations').update({ access_token: 'PENDENTE_DE_CONEXAO' }).eq('platform', 'facebook');
             }
             return new Response(JSON.stringify({ success: false, error: pagesData.error.message }), { status: 200, headers: corsHeaders });
        }

        const pages = pagesData.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            access_token: p.access_token
        }));
        
        log(`Retornando ${pages.length} páginas.`);
        return new Response(JSON.stringify({ success: true, pages }), { headers: corsHeaders, status: 200 });
    }
    
    // --- AÇÃO 3: FETCH PAGES MANUAL (SINCRONIZAÇÃO) ---
    if (action === 'fetch_pages') {
        // Redireciona para a lógica de listagem, mas atualiza o DB
        // (Reutilizando lógica similar à get_connected_pages mas com update de metadados)
        // ... (Simplificado para usar get_connected_pages no frontend na maioria dos casos)
        return new Response(JSON.stringify({ success: true, message: "Use get_connected_pages action instead." }), { headers: corsHeaders, status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida.' }), { headers: corsHeaders, status: 400 });

  } catch (err) {
    log("Exceção não tratada:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || "Erro interno no servidor." }), { headers: corsHeaders, status: 200 });
  }
});