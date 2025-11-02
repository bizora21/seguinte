// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Inicializa o cliente Supabase com a SERVICE_ROLE_KEY
// Esta chave tem permissões para agir como o próprio serviço, ignorando a autenticação de usuário.
// @ts-ignore
const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // CHAVE DE SERVIÇO
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
  
  const url = new URL(req.url);
  const keyword = url.searchParams.get('keyword');
  const context = url.searchParams.get('context') || 'Moçambique';
  const audience = url.searchParams.get('audience') || 'Empreendedores';
  const type = url.searchParams.get('type') || 'Guia prático';
  
  // 1. Verificar se a palavra-chave está presente
  if (!keyword) {
      console.error("DEBUG: Keyword missing.");
      return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
  }

  try {
    console.log(`DEBUG: Enfileirando job para: ${keyword} (usando Service Role Key)`);
    
    // Payload completo para o job processor
    const jobPayload = {
        keyword,
        context,
        audience,
        type,
    }
    
    // INSERÇÃO COM SERVICE ROLE KEY
    // A inserção é feita em nome do serviço, não do usuário.
    // As políticas RLS na tabela 'generation_jobs' devem permitir isso.
    const { data: job, error: insertError } = await supabaseServiceRole
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