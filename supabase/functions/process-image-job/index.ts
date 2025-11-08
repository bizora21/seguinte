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
    const { job_id } = await req.json()
    if (!job_id) throw new Error('O ID da tarefa é obrigatório.')

    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Obtém detalhes da tarefa e atualiza o status para 'processando'
    const { data: job, error: fetchError } = await supabase
      .from('generation_jobs')
      .update({ status: 'processing', progress: 25 })
      .eq('id', job_id)
      .select('keyword')
      .single()

    if (fetchError) throw new Error(`Tarefa não encontrada ou não pôde ser atualizada: ${fetchError.message}`)
    
    const prompt = job.keyword

    // 2. Chama a API do Unsplash
    await supabase.from('generation_jobs').update({ progress: 50 }).eq('id', job_id)
    // @ts-ignore
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')
    if (!UNSPLASH_ACCESS_KEY) throw new Error('O segredo UNSPLASH_ACCESS_KEY não está configurado.')

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&per_page=1&orientation=landscape`
    const unsplashResponse = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } })
    if (!unsplashResponse.ok) throw new Error(`A API do Unsplash falhou: ${unsplashResponse.statusText}`)
    
    const unsplashData = await unsplashResponse.json()
    if (!unsplashData.results || unsplashData.results.length === 0) {
      throw new Error('Nenhuma imagem encontrada no Unsplash para o prompt.')
    }

    const imageUrl = unsplashData.results[0].urls.regular
    const altText = unsplashData.results[0].alt_description || prompt

    // 3. Atualiza a tarefa com o resultado
    await supabase.from('generation_jobs').update({ 
      status: 'completed', 
      progress: 100,
      result_data: { imageUrl, altText }
    }).eq('id', job_id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Se algo falhar, atualiza a tarefa com a mensagem de erro
    const { job_id } = await req.json().catch(() => ({ job_id: null }))
    if (job_id) {
      // @ts-ignore
      const supabase = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      )
      await supabase.from('generation_jobs').update({ 
        status: 'failed', 
        error_message: error.message 
      }).eq('id', job_id)
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})