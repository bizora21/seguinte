// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Cliente com Service Role para operações seguras no backend
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
  console.log(`[ORQUESTRADOR DE CONTEÚDO - ${new Date().toISOString()}] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // --- PASSO 1: VALIDAÇÃO E PREPARAÇÃO ---
    const { keyword, context, audience, type } = await req.json()
    if (!keyword) {
      return new Response(JSON.stringify({ error: 'O campo "keyword" é obrigatório.' }), { status: 400, headers: corsHeaders })
    }
    log(`Iniciando orquestração para o tópico: "${keyword}"`);

    // --- PASSO 2: GERAÇÃO DE CONTEÚDO AVANÇADO (OPENAI) ---
    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada como secret.')

    const openaiPrompt = `
      Você é um especialista em SEO e marketing de conteúdo para o mercado de Moçambique.
      Gere um artigo completo e otimizado sobre o tópico "${keyword}".
      O público-alvo é "${audience}" e o contexto local é "${context}". O formato é "${type}".
      
      Sua resposta DEVE ser um único objeto JSON com a seguinte estrutura:
      {
        "title": "Um título H1 otimizado para SEO com 60-70 caracteres.",
        "meta_description": "Uma meta descrição otimizada com 150-160 caracteres.",
        "content_html": "O artigo completo em formato HTML, com no mínimo 1500 palavras, usando tags <h2>, <h3>, <p>, <ul>, <li> e <strong>. O conteúdo deve ser prático, útil e localizado para Moçambique.",
        "image_prompt": "Um prompt curto e descritivo em INGLÊS para buscar uma imagem de alta qualidade no Unsplash. Ex: 'busy marketplace in Maputo, Mozambique'.",
        "secondary_keywords": ["uma", "lista", "de", "5", "palavras-chave LSI"],
        "internal_links": [{ "title": "Nome do Artigo Interno", "url": "/blog/slug-do-artigo" }],
        "external_links": [{ "title": "Nome do Site Externo", "url": "https://exemplo.com" }]
      }
    `
    
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
    const generatedContent = JSON.parse(openaiData.choices[0].message.content)
    log(`Conteúdo HTML e de SEO gerado pela OpenAI.`);

    // --- PASSO 3: BUSCA DE IMAGEM (UNSPLASH) ---
    // @ts-ignore
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')
    if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY não configurada como secret.')

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(generatedContent.image_prompt)}&per_page=1&orientation=landscape`
    
    const unsplashResponse = await fetch(unsplashUrl, {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    })

    if (!unsplashResponse.ok) throw new Error(`Falha na chamada de API para Unsplash: ${unsplashResponse.statusText}`)
    const unsplashData = await unsplashResponse.json()
    if (!unsplashData.results || unsplashData.results.length === 0) throw new Error(`Nenhuma imagem encontrada para o prompt: ${generatedContent.image_prompt}`)
    
    const imageUrl = unsplashData.results[0].urls.regular
    log(`Imagem encontrada no Unsplash: ${imageUrl}`);

    // --- PASSO 4: UPLOAD DA IMAGEM PARA O SUPABASE STORAGE ---
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const imagePath = `blog-images/${Date.now()}-${generatedContent.title.toLowerCase().replace(/\s+/g, '-')}.jpg`

    const { error: uploadError } = await supabaseServiceRole.storage
      .from('blog-images')
      .upload(imagePath, imageBlob, { contentType: 'image/jpeg' })

    if (uploadError) throw new Error(`Falha no upload da imagem para o Supabase: ${uploadError.message}`)

    const { data: publicUrlData } = supabaseServiceRole.storage
      .from('blog-images')
      .getPublicUrl(imagePath)
    
    const finalImageUrl = publicUrlData.publicUrl
    log(`Imagem salva no Supabase Storage: ${finalImageUrl}`);

    // --- PASSO 5: ARMAZENAMENTO NO BANCO DE DADOS ---
    const { data: newRecord, error: insertError } = await supabaseServiceRole
      .from('content_drafts')
      .insert({
        title: generatedContent.title,
        meta_description: generatedContent.meta_description,
        content: generatedContent.content_html,
        featured_image_url: finalImageUrl,
        image_prompt: generatedContent.image_prompt,
        secondary_keywords: generatedContent.secondary_keywords,
        internal_links: generatedContent.internal_links,
        external_links: generatedContent.external_links,
        status: 'draft',
        keyword: keyword,
        context: context,
        audience: audience,
        model: 'gpt-4o'
      })
      .select('id')
      .single()

    if (insertError) throw new Error(`Falha ao salvar no banco de dados: ${insertError.message}`)
    log(`Rascunho completo salvo no banco de dados com ID: ${newRecord.id}`);

    // --- PASSO 6: RESPOSTA FINAL ---
    return new Response(JSON.stringify({
      success: true,
      message: "Artigo completo gerado e salvo como rascunho.",
      draftId: newRecord.id
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