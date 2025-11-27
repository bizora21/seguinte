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
    
    if (body.action === 'publish_now') {
        const { content, platform, imageUrl } = body;
        const targetPlatform = platform || 'facebook';

        // 3. Buscar Token
        const { data: integration, error: dbError } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('platform', targetPlatform)
            .maybeSingle();

        if (dbError) throw new Error(`Erro de Banco de Dados: ${dbError.message}`);
        
        // --- CORREÇÃO: Tratamento de Erro Robusto (HTTP 412) ---
        if (!integration) {
            return new Response(JSON.stringify({
                error: 'INTEGRATION_NOT_FOUND',
                message: `A integração com ${targetPlatform} não foi encontrada. Por favor, reconecte na aba de Configurações.`,
                provider: targetPlatform
            }), { 
                status: 412, // Precondition Failed
                headers: corsHeaders 
            });
        }

        const pageId = integration.metadata?.page_id;
        const pageToken = integration.metadata?.page_access_token || integration.access_token;

        if (!pageId) {
             return new Response(JSON.stringify({
                error: 'PAGE_NOT_SELECTED',
                message: 'Conta conectada, mas nenhuma Página foi selecionada. Clique em "Sincronizar Páginas" nas configurações.',
                provider: targetPlatform
            }), { 
                status: 412, 
                headers: corsHeaders 
            });
        }

        // 4. Publicar no Facebook
        const endpoint = imageUrl 
            ? `https://graph.facebook.com/v19.0/${pageId}/photos`
            : `https://graph.facebook.com/v19.0/${pageId}/feed`;
            
        const fbBody = imageUrl 
            ? { url: imageUrl, caption: content, access_token: pageToken, published: true }
            : { message: content, access_token: pageToken };

        const fbResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fbBody)
        });
        
        const fbData = await fbResponse.json();
        
        if (fbData.error) {
            // Se o token for inválido, retornamos um erro específico também
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