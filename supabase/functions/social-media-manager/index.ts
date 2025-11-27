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
const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    },
  },
)

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // --- AUTHENTICATION ---
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

  if (authError || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 401, headers: corsHeaders })
  }
  // --- END AUTHENTICATION ---
  
  try {
    const body = await req.json().catch(() => ({}))
    
    // Ação: Publicar Agora (REAL)
    if (body.action === 'publish_now') {
        const { content, platform, imageUrl } = body;

        if (platform === 'facebook_instagram' || platform === 'facebook') {
            // 1. Buscar token válido no banco
            const { data: integration, error: tokenError } = await supabase
                .from('integrations')
                .select('access_token, metadata')
                .eq('platform', 'facebook')
                .single();

            if (tokenError || !integration) {
                throw new Error('Integração com Facebook não encontrada. Conecte a conta nas configurações.');
            }

            let pageId = integration.metadata?.page_id;
            let pageAccessToken = integration.access_token; // Inicialmente o token do usuário

            // Se não tivermos o Page ID salvo, vamos buscá-lo e pegar o Page Access Token correto
            if (!pageId) {
                 console.log("Fetching Facebook Pages...");
                 const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${integration.access_token}`);
                 const pagesData = await pagesResp.json();
                 
                 if (pagesData.data && pagesData.data.length > 0) {
                     // Pega a primeira página (Lógica simples - idealmente o usuário escolheria)
                     const page = pagesData.data[0];
                     pageId = page.id;
                     pageAccessToken = page.access_token; // TOKEN DA PÁGINA (Necessário para postar como a página)
                     
                     // Atualizar o banco com o ID da página para o futuro
                     await supabase.from('integrations').update({
                         metadata: { ...integration.metadata, page_id: pageId, page_name: page.name }
                     }).eq('platform', 'facebook');
                 } else {
                     throw new Error('Nenhuma página do Facebook encontrada para esta conta. Crie uma página primeiro.');
                 }
            } else {
                // Se já temos o Page ID, precisamos garantir que temos o token da página, não do usuário.
                // Para simplificar, assumimos que na primeira conexão já salvamos o token correto ou refazemos o fetch acima.
                // Em produção robusta, salvaríamos 'page_access_token' separadamente.
                
                // Fallback de segurança: Buscar token da página novamente
                const pagesResp = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${integration.access_token}`);
                const pageData = await pagesResp.json();
                if (pageData.access_token) {
                    pageAccessToken = pageData.access_token;
                }
            }

            // 2. Realizar a publicação
            const endpoint = imageUrl 
                ? `https://graph.facebook.com/v19.0/${pageId}/photos`
                : `https://graph.facebook.com/v19.0/${pageId}/feed`;
                
            const fbBody = imageUrl 
                ? { url: imageUrl, caption: content, access_token: pageAccessToken }
                : { message: content, access_token: pageAccessToken };

            console.log(`Posting to Facebook Page ${pageId}...`);
            const fbResponse = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fbBody)
            });
            
            const fbData = await fbResponse.json();
            
            if (fbData.error) {
                console.error("Facebook API Error:", fbData.error);
                throw new Error(`Facebook Error: ${fbData.error.message}`);
            }

            return new Response(JSON.stringify({ 
                success: true, 
                jobId: fbData.id, // ID do post no Facebook
                message: 'Publicado no Facebook com sucesso!' 
            }), {
                headers: corsHeaders,
                status: 200,
            });
        }
    }
    
    // Ação: Agendar (Salva no banco para um Cron Job processar depois)
    if (body.action === 'schedule_post') {
      const { content, scheduleTime, platform } = body
      
      const { data, error } = await supabase.from('jobs').insert({
        type: 'social_post',
        status: 'pending',
        payload: { content, scheduleTime, platform }
      }).select().single()
      
      if (error) throw error
      
      return new Response(JSON.stringify({ success: true, jobId: data.id, message: 'Agendamento salvo no banco de dados.' }), {
        headers: corsHeaders,
        status: 200,
      })
    }
    
    return new Response(JSON.stringify({ message: 'Action not implemented' }), {
      headers: corsHeaders,
      status: 400,
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})