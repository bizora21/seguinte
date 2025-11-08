// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { prompt } = await req.json()
    if (!prompt) throw new Error('O prompt é obrigatório.')

    // 1. Cria uma nova tarefa na tabela 'generation_jobs'
    const { data: job, error: insertError } = await supabase
      .from('generation_jobs')
      .insert({ keyword: prompt, status: 'queued', progress: 0 })
      .select('id')
      .single()

    if (insertError) throw insertError

    // 2. Invoca de forma assíncrona a função de trabalho (sem esperar pela resposta)
    supabase.functions.invoke('process-image-job', {
      body: { job_id: job.id },
    })

    // 3. Retorna imediatamente o ID da tarefa para o cliente
    return new Response(JSON.stringify({ success: true, jobId: job.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202, // 202 Accepted
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})