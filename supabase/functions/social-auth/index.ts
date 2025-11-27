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
    // Usar a chave de serviço para ter poder total sobre o banco (ignora RLS)
    const supabaseAdmin = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
    )

    const { action, code, platform, redirect_uri } = await req.json()

    if (action === 'exchange_token') {
        const cleanPlatform = (platform || 'facebook').toLowerCase().trim();
        log(`Iniciando troca de token para: ${cleanPlatform}`);
        
        let accessToken = '';
        let expiresIn = null;
        let metadata: any = {};

        if (cleanPlatform === 'facebook') {
            // 1. Trocar Code por Short-Lived Token
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect_uri)}&code=${code}`;
            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json();

            if (tokenData.error) {
                log("Erro Facebook OAuth (Short):", tokenData.error);
                return new Response(JSON.stringify({ error: tokenData.error.message }), { status: 400, headers: corsHeaders });
            }

            accessToken = tokenData.access_token;
            expiresIn = tokenData.expires_in;

            // 2. Trocar Short-Lived por Long-Lived Token
            const longUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`;
            const longResp = await fetch(longUrl);
            const longData = await longResp.json();
            
            if (longData.access_token) {
                accessToken = longData.access_token;
                expiresIn = longData.expires_in;
                log("Long-lived token obtido com sucesso.");
            }

            // 3. Buscar Páginas e pegar o Page Access Token (CRUCIAL PARA PUBLICAÇÃO)
            const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
            const pagesData = await pagesResp.json();
            
            if (pagesData.data && pagesData.data.length > 0) {
                const page = pagesData.data[0];
                metadata.page_id = page.id;
                metadata.page_name = page.name;
                metadata.page_access_token = page.access_token; // Este é o token que permite publicar na página
                log(`Página encontrada: ${page.name} (${page.id})`);
            } else {
                log("Nenhuma página encontrada vinculada à conta.");
            }
        } 
        
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        log("Tentando salvar no banco...", { platform: cleanPlatform });

        // ESTRATÉGIA ROBUSTA: Tentar UPDATE primeiro, se não existir, fazer INSERT
        // Isso evita problemas com chaves primárias ou restrições estranhas do upsert
        
        // 1. Tentar UPDATE
        const { data: updateData, error: updateError } = await supabaseAdmin
            .from('integrations')
            .update({
                access_token: accessToken,
                expires_at: expiresAt,
                metadata: metadata,
                updated_at: new Date().toISOString()
            })
            .eq('platform', cleanPlatform)
            .select()
            .maybeSingle();

        if (updateError) {
             log("Erro no UPDATE:", updateError);
             return new Response(JSON.stringify({ error: "Erro ao atualizar token: " + updateError.message }), { status: 500, headers: corsHeaders });
        }

        let finalData = updateData;

        // 2. Se UPDATE não afetou nada (registro não existe), fazer INSERT
        if (!updateData) {
            log("Registro não encontrado, tentando INSERT...");
            const { data: insertData, error: insertError } = await supabaseAdmin
                .from('integrations')
                .insert({
                    platform: cleanPlatform,
                    access_token: accessToken,
                    expires_at: expiresAt,
                    metadata: metadata,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (insertError) {
                log("Erro no INSERT:", insertError);
                return new Response(JSON.stringify({ error: "Erro ao criar integração: " + insertError.message }), { status: 500, headers: corsHeaders });
            }
            finalData = insertData;
        }

        log("Sucesso Absoluto! Dados salvos:", finalData);
        return new Response(JSON.stringify({ success: true, saved: finalData }), { headers: corsHeaders, status: 200 });
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
    log("Exceção não tratada:", err);
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 500 });
  }
});