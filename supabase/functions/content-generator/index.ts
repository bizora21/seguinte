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
  
  const url = new URL(req.url);
  const keyword = url.searchParams.get('keyword');
  const context = url.searchParams.get('context') || 'Moçambique';
  const audience = url.searchParams.get('audience') || 'Empreendedores';
  const type = url.searchParams.get('type') || 'Guia prático';
  
  // 1. Autenticação (Admin apenas)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error("DEBUG: Authorization header missing.");
    return new Response(JSON.stringify({ error: 'Unauthorized: Authorization header missing.' }), { status: 401, headers: corsHeaders })
  }
  
  // 2. Verificar se a palavra-chave está presente
  if (!keyword) {
      console.error("DEBUG: Keyword missing.");
      return new Response(JSON.stringify({ error: 'Bad Request: Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
  }

  try {
    // 3. Verificar se o usuário é o administrador (RLS deve cuidar disso, mas é bom ter uma verificação extra)
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
        console.error("DEBUG: Invalid token or user not found.", userError);
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token.' }), { status: 401, headers: corsHeaders })
    }
    
    // Se a autenticação passou, prosseguir com a inserção do job
    console.log(`DEBUG: User ${userData.user.id} authenticated. Enfileirando job para: ${keyword}`);
    
    // Payload completo para o job processor
    const jobPayload = {
        keyword,
        context,
        audience,
        type,
    }
    
    // Insere o job na fila (tabela generation_jobs)
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
        console.error("DEBUG: Supabase Insert Error:", insertError);
        return new Response(JSON.stringify({ error: `Supabase Insert Error: ${insertError.message}` }), { status: 500, headers: corsHeaders })
    }
    
    // Retorna o ID do job imediatamente
    return new Response(JSON.stringify({ jobId: job.id, status: 'queued' }), {
      headers: corsHeaders,
      status: 202, // Accepted
    })

  } catch (error) {
    console.error('Edge Function Error (Catch Block):', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})