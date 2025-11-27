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
    // 1. Validar Usuário (Deve ser Admin)
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

        // 3. Buscar Token
        const { data: integration, error: dbError } = await supabaseAdmin
            .from('integrations')
            .select('*') // Selecionar tudo para debug
            .eq('platform', 'facebook')
            .maybeSingle(); // Usa maybeSingle para não lançar erro se vazio

        if (dbError) throw new Error(`Erro de Banco de Dados: ${dbError.message}`);
        
        if (!integration) {
            throw new Error('Integração com Facebook não encontrada. Por favor, vá em "Configurações & Conexões" e clique em "Conectar Facebook".');
        }

        const pageId = integration.metadata?.page_id;
        const pageToken = integration.metadata?.page_access_token || integration.access_token;

        if (!pageId) {
            throw new Error('Conta conectada, mas nenhuma Página do Facebook foi selecionada. Tente clicar em "Sincronizar Páginas" nas configurações.');
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