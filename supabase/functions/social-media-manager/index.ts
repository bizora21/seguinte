// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const ADMIN_EMAIL = 'lojarapidamz@outlook.com'

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // 1. Validar Usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Sem token de autorização')
    
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        throw new Error('Apenas o administrador pode publicar.')
    }

    // 2. Cliente Admin para DB
    const supabaseAdmin = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const body = await req.json()
    
    // --- NOVO: AÇÃO DE ENCURTAR LINK ---
    if (body.action === 'shorten_link') {
        const { url } = body;
        if (!url) throw new Error('URL necessária');

        // Usa a API pública do TinyURL (simples e robusta)
        const tinyResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        
        if (!tinyResponse.ok) {
            throw new Error('Falha ao encurtar link no serviço externo.');
        }

        const shortUrl = await tinyResponse.text();
        return new Response(JSON.stringify({ success: true, shortUrl }), { headers: corsHeaders, status: 200 });
    }

    if (body.action === 'publish_now') {
        const { content, platform, imageUrl, pageId } = body;
        const targetPlatform = platform || 'facebook';

        if (!pageId) {
             return new Response(JSON.stringify({
                error: 'PAGE_NOT_SELECTED',
                message: 'Por favor, selecione uma Página do Facebook para publicar.',
                provider: targetPlatform
            }), { status: 400, headers: corsHeaders });
        }

        // 3. Buscar Token do USUÁRIO
        const { data: integration, error: dbError } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', targetPlatform)
            .maybeSingle();

        if (dbError || !integration || integration.access_token === 'PENDENTE_DE_CONEXAO') {
            return new Response(JSON.stringify({
                error: 'INTEGRATION_NOT_FOUND',
                message: 'Integração não encontrada ou desconectada.',
                provider: targetPlatform
            }), { status: 412, headers: corsHeaders });
        }

        // 4. Obter o Token da PÁGINA Específica
        // Usamos o token do usuário para pedir permissão "em nome da página"
        const pageTokenResp = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${integration.access_token}`);
        const pageTokenData = await pageTokenResp.json();

        if (pageTokenData.error || !pageTokenData.access_token) {
             return new Response(JSON.stringify({
                error: 'PAGE_TOKEN_ERROR',
                message: `Não foi possível obter permissão para a página ${pageId}. O usuário admin tem permissão nela? Detalhe: ${pageTokenData.error?.message}`,
                provider: targetPlatform
            }), { status: 400, headers: corsHeaders });
        }

        const pageAccessToken = pageTokenData.access_token;

        // 5. Publicar no Facebook usando o Token da Página
        const endpoint = imageUrl 
            ? `https://graph.facebook.com/v19.0/${pageId}/photos`
            : `https://graph.facebook.com/v19.0/${pageId}/feed`;
            
        const fbBody = imageUrl 
            ? { url: imageUrl, caption: content, access_token: pageAccessToken, published: true }
            : { message: content, access_token: pageAccessToken };

        const fbResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fbBody)
        });
        
        const fbData = await fbResponse.json();
        
        if (fbData.error) {
            if (fbData.error.code === 190) { // OAuth Exception
                 return new Response(JSON.stringify({
                    error: 'TOKEN_EXPIRED',
                    message: 'A sessão do Facebook expirou. Por favor, reconecte nas Configurações.',
                    provider: targetPlatform
                }), { status: 412, headers: corsHeaders });
            }
            throw new Error(`Facebook recusou: ${fbData.error.message}`);
        }

        return new Response(JSON.stringify({ success: true, jobId: fbData.id }), { headers: corsHeaders, status: 200 });
    }
    
    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), { headers: corsHeaders, status: 400 })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 })
  }
})