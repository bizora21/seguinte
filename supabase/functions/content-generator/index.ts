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
  { auth: { persistSession: false } }
)

// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[ORQUESTRADOR - ${new Date().toISOString()}] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // --- PASSO 1: PREPARAÇÃO ---
    const { topico } = await req.json()
    if (!topico) {
      return new Response(JSON.stringify({ error: 'O campo "topico" é obrigatório.' }), { status: 400, headers: corsHeaders })
    }
    log(`Iniciando geração de conteúdo para o tópico: ${topico}`);

    // --- PASSO 2: GERAÇÃO DE CONTEÚDO (OPENAI) ---
    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada como secret.')

    const openaiPrompt = `Gere um artigo otimizado para SEO sobre o tópico '${topico}'. Além disso, crie um prompt de imagem em inglês, curto e descritivo, ideal para buscar uma foto de alta qualidade no Unsplash. Responda exclusivamente em formato JSON com três chaves: "titulo", "artigo" e "prompt_imagem".`
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: openaiPrompt }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.json()
      throw new Error(`Falha na chamada de API para OpenAI: ${errorBody.error?.message || openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const rawContent = openaiData.choices[0].message.content
    const generatedContent = JSON.parse(rawContent)

    // --- PASSO 3: VALIDAÇÃO DA RESPOSTA DA OPENAI ---
    const texto_do_artigo = generatedContent.artigo
    const prompt_para_imagem = generatedContent.prompt_imagem
    const titulo_do_artigo = generatedContent.titulo

    if (!texto_do_artigo || !prompt_para_imagem || !titulo_do_artigo) {
      log("Erro: Resposta da OpenAI inválida ou incompleta.", generatedContent)
      return new Response(JSON.stringify({ error: 'Resposta da OpenAI inválida ou incompleta.' }), { status: 500, headers: corsHeaders })
    }
    log(`Artigo e prompt de imagem gerados com sucesso. Prompt da imagem: ${prompt_para_imagem}`);

    // --- PASSO 4: BUSCA DE IMAGEM (UNSPLASH) ---
    // @ts-ignore
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')
    if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY não configurada como secret.')

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt_para_imagem)}&per_page=1&orientation=landscape`
    
    const unsplashResponse = await fetch(unsplashUrl, {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    })

    if (!unsplashResponse.ok) {
      throw new Error(`Falha na chamada de API para Unsplash: ${unsplashResponse.statusText}`)
    }

    const unsplashData = await unsplashResponse.json()

    // --- PASSO 5: VALIDAÇÃO DA RESPOSTA DA UNSPLASH ---
    if (!unsplashData.results || unsplashData.results.length === 0) {
      log(`Erro: Nenhuma imagem encontrada no Unsplash para o prompt: ${prompt_para_imagem}`)
      return new Response(JSON.stringify({ error: `Nenhuma imagem encontrada para o prompt: ${prompt_para_imagem}` }), { status: 404, headers: corsHeaders })
    }

    const url_da_imagem_destaque = unsplashData.results[0].urls.regular
    log(`Imagem encontrada no Unsplash: ${url_da_imagem_destaque}`);

    // --- PASSO 6: ARMAZENAMENTO NO BANCO DE DADOS (SUPABASE) ---
    const { data: newRecord, error: insertError } = await supabaseServiceRole
      .from('content_drafts') // Usando a tabela de rascunhos para consistência
      .insert({
        title: titulo_do_artigo,
        content: texto_do_artigo,
        featured_image_url: url_da_imagem_destaque,
        status: 'draft', // Salvar como rascunho para revisão
        keyword: topico,
        // Outros campos de SEO podem ser gerados em uma etapa posterior ou deixados nulos
      })
      .select('id')
      .single()

    if (insertError) {
      throw new Error(`Falha ao salvar no banco de dados: ${insertError.message}`)
    }
    log(`Artigo e URL da imagem salvos no banco de dados com ID: ${newRecord.id}`);

    // --- PASSO 7: RESPOSTA FINAL ---
    return new Response(JSON.stringify({
      success: true,
      message: "Artigo e imagem gerados com sucesso e salvos como rascunho.",
      data: {
        id: newRecord.id,
        imagem_url: url_da_imagem_destaque
      }
    }), {
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    log(`Falha na execução: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})