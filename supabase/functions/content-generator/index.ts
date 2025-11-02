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
  
  const url = new URL(req.url);
  const keyword = url.searchParams.get('keyword');
  const context = url.searchParams.get('context') || 'Moçambique';
  const audience = url.searchParams.get('audience') || 'Empreendedores';
  const type = url.searchParams.get('type') || 'Guia prático';
  
  if (!keyword) {
      console.error("DEBUG: Keyword missing.");
      return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
  }

  try {
    console.log(`DEBUG: Enfileirando job para: ${keyword} (usando Service Role Key)`);
    
    const jobPayload = {
        keyword,
        context,
        audience,
        type,
    }
    
    const { data: job, error: insertError } = await supabaseServiceRole
        .from('generation_jobs')
        .insert({
            keyword: keyword,
            status: 'queued',
            progress: 0,
            result_data: jobPayload,
        })
        .select('id')
        .single()

    if (insertError) {
        console.error("DEBUG: FALHA NA INSERÇÃO DO JOB!");
        console.error("DEBUG: Erro de Inserção:", insertError);
        console.error("DEBUG: Mensagem do Erro:", insertError.message);
        console.error("DEBUG: Detalhes do Erro:", insertError.details);
        console.error("DEBUG: Hint do Erro:", insertError.hint);
        return new Response(JSON.stringify({ error: `Falha ao enfileirar job: ${insertError.message}` }), { status: 500, headers: corsHeaders })
    }
    
    console.log(`DEBUG: Job inserido com sucesso! ID: ${job.id}`);
    
    // --- INÍCIO DA NOVA LÓGICA ---
    // Agora, chamar a job-processor para iniciar o processamento deste job
    console.log(`DEBUG: Iniciando processamento do job ${job.id} via job-processor...`);
    try {
      // @ts-ignore
      const processorResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/job-processor`, {
        method: 'POST',
        headers: {
          // @ts-ignore
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
          // @ts-ignore
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')
        },
        body: JSON.stringify({ jobId: job.id })
      });

      if (!processorResponse.ok) {
        const errorText = await processorResponse.text();
        console.error(`DEBUG: Falha ao chamar job-processor. Status: ${processorResponse.status}. Resposta: ${errorText}`);
      } else {
        console.log(`DEBUG: job-processor chamado com sucesso para o job ${job.id}.`);
      }
    } catch (processorError) {
      console.error(`DEBUG: Erro ao chamar job-processor:`, processorError);
    }
    // --- FIM DA NOVA LÓGICA ---

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