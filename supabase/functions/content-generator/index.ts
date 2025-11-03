// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// @ts-ignore
const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
  
  // 1. Autenticação e Extração do UID
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  // Usar o cliente Supabase para verificar o token e obter o UID
  const { data: userData, error: authError } = await supabaseServiceRole.auth.getUser(token)
  
  if (authError || !userData.user) {
    console.error('Authentication failed:', authError?.message)
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: corsHeaders })
  }
  
  const userId = userData.user.id;
  
  try {
    if (req.method === 'POST') {
        // Processamento da requisição POST
        const body = await req.json();
        const { keyword, context, audience, type } = body;
        
        if (!keyword) {
            return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
        }

        console.log(`DEBUG: Enfileirando job para: ${keyword} por user ${userId}`);
        
        // Simulação de conteúdo gerado pela IA
        const mockContent = {
            title: `Guia Completo: ${keyword} em Moçambique`,
            slug: keyword.toLowerCase().replace(/\s+/g, '-'),
            meta_description: `Descubra como ${keyword} no contexto de Moçambique. Dicas essenciais para ${audience}.`,
            content: `## Introdução\n\nEste é um artigo gerado por IA sobre **${keyword}** focado em ${context}. O conteúdo é um ${type} para ${audience}.\n\n[CTA: Cadastre-se Agora]\n\n## Dicas Práticas\n\n* Dica 1: Adapte-se ao mercado local.\n* Dica 2: Use o Pagamento na Entrega.\n\n## Conclusão\n\nEsperamos que este guia ajude você a ter sucesso em Moçambique.`,
            seo_score: Math.floor(Math.random() * 30) + 70, // 70-100
            context: context,
            audience: audience,
        }
        
        const { data: draft, error: insertError } = await supabaseServiceRole
            .from('content_drafts')
            .insert({
                user_id: userId, // Usando o ID do usuário autenticado
                keyword: keyword,
                status: 'draft',
                title: mockContent.title,
                slug: mockContent.slug,
                meta_description: mockContent.meta_description,
                content: mockContent.content,
                seo_score: mockContent.seo_score,
                context: mockContent.context,
                audience: mockContent.audience,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error("DEBUG: FALHA NA INSERÇÃO DO RASCUNHO:", insertError);
            return new Response(JSON.stringify({ error: `Falha ao criar rascunho: ${insertError.message}` }), { status: 500, headers: corsHeaders })
        }
        
        console.log(`DEBUG: Rascunho inserido com sucesso! ID: ${draft.id}`);

        return new Response(JSON.stringify({ success: true, draftId: draft.id, status: 'draft_created' }), {
          headers: corsHeaders,
          status: 200, 
        })
    }
    
    // Se não for OPTIONS nem POST, retorna 405
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('Edge Function Error (Catch Block):', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})