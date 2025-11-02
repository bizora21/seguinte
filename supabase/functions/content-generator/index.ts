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
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const url = new URL(req.url);
  const keyword = url.searchParams.get('keyword');
  const context = url.searchParams.get('context') || 'Moçambique';
  const audience = url.searchParams.get('audience') || 'Empreendedores';
  const type = url.searchParams.get('type') || 'Guia prático';
  
  // 1. Autenticação e Extração do Token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error("DEBUG: Authorization header missing.");
    return new Response(JSON.stringify({ error: 'Unauthorized: Authorization header missing.' }), { status: 401, headers: corsHeaders })
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // 2. Inicializar o cliente Supabase com o token do usuário
  // @ts-ignore
  const supabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    },
  )
  
  // 3. Verificar se a palavra-chave está presente
  if (!keyword) {
      console.error("DEBUG: Keyword missing.");
      return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
  }

  try {
    // 4. Verificar se o usuário é o administrador (o RLS fará a verificação final)
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
        console.error("DEBUG: Invalid token or user not found.", userError);
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token.' }), { status: 401, headers: corsHeaders })
    }
    
    console.log(`DEBUG: User ${userData.user.id} authenticated. Enfileirando job para: ${keyword}`);
    
    // Payload completo para o job processor
    const jobPayload = {
        keyword,
        context,
        audience,
        type,
    }
    
    // INSERÇÃO COM TIMEOUT E LOG DE ERRO DETALHADO
    console.log("DEBUG: Tentando inserir job na tabela 'generation_jobs'...");
    const { data: job, error: insertError } = await supabase
        .from('generation_jobs')
        .insert({
            keyword: keyword,
            status: 'queued',
            progress: 0,
            result_data: jobPayload, // Armazena o payload de entrada
        })
        .select('id')
        .single()

    if (insertError) {
        console.error("DEBUG: FALHA NA INSERÇÃO DO JOB!");
        console.error("DEBUG: Erro de Inserção:", insertError);
        console.error("DEBUG: Mensagem do Erro:", insertError.message);
        console.error("DEBUG: Detalhes do Erro:", insertError.details);
        console.error("DEBUG: Hint do Erro:", insertError.hint);
        // Retorna 500 com a mensagem de erro detalhada
        return new Response(JSON.stringify({ error: `Falha ao enfileirar job: ${insertError.message}` }), { status: 500, headers: corsHeaders })
    }
    
    console.log(`DEBUG: Job inserido com sucesso! ID: ${job.id}`);
    
    // Retorna o ID do job imediatamente
    return new Response(JSON.stringify({ jobId: job.id, status: 'queued' }), {
      headers: corsHeaders,
      status: 200, 
    })

  } catch (error) {
    console.error('Edge Function Error (Catch Block):', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})