// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[CONTENT-ORCHESTRATOR - ${new Date().toISOString()}] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()
    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured.')

    if (action === 'generate') {
      // --- LÓGICA DE GERAÇÃO COMPLETA ---
      const { keyword, context, audience, type } = payload
      if (!keyword) throw new Error('Keyword is required.')
      log(`Starting full generation for: "${keyword}"`);

      const prompt = `
        Você é um especialista de classe mundial em SEO e marketing de conteúdo para o mercado de Moçambique, focado em criar artigos que se classificam no Google e são otimizados para o Google Discover.
        Sua tarefa é gerar um artigo completo, humanizado e de alta qualidade sobre o tópico "${keyword}".
        - Público-alvo: "${audience}"
        - Contexto local: "${context}"
        - Formato: "${type}"

        REQUISITOS OBRIGATÓRIOS:
        1.  **Qualidade do Conteúdo**: O texto deve ser 100% humanizado, envolvente, prático e demonstrar E-E-A-T (Experiência, Especialização, Autoridade, Confiança). Mínimo de 1500 palavras.
        2.  **Formato HTML**: O conteúdo principal deve estar em HTML, usando tags <h2>, <h3>, <p>, <ul>, <li>, e <strong>.
        3.  **SEO Completo**: Todos os campos do JSON devem ser preenchidos de forma otimizada.

        Sua resposta DEVE ser um único objeto JSON com a seguinte estrutura:
        {
          "title": "Um título H1 otimizado para SEO (60-70 caracteres).",
          "meta_description": "Uma meta descrição otimizada e persuasiva (150-160 caracteres).",
          "content_html": "O artigo completo em HTML (mínimo 1500 palavras).",
          "image_prompt": "Um prompt curto e descritivo em INGLÊS para buscar uma imagem de alta qualidade no Unsplash. Ex: 'entrepreneur in Maputo working on a laptop'.",
          "image_alt_text": "Um texto alternativo (ALT text) para a imagem, em PORTUGUÊS, otimizado para SEO.",
          "secondary_keywords": ["uma", "lista", "de", "5", "palavras-chave LSI relevantes"],
          "internal_links": [{ "title": "Sugestão de Título de Artigo Interno", "url": "/blog/slug-sugerido" }],
          "external_links": [{ "title": "Nome do Site de Referência", "url": "https://exemplo.com" }],
          "structured_data": {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "O mesmo que o campo 'title'",
            "description": "O mesmo que o campo 'meta_description'",
            "author": { "@type": "Organization", "name": "LojaRápida" },
            "publisher": { "@type": "Organization", "name": "LojaRápida", "logo": { "@type": "ImageObject", "url": "https://lojarapidamz.com/favicon.svg" } }
          }
        }
      `
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
      })
      if (!openaiResponse.ok) throw new Error(`OpenAI API Error: ${await openaiResponse.text()}`)
      const openaiData = await openaiResponse.json()
      const generated = JSON.parse(openaiData.choices[0].message.content)
      log(`Conteúdo de alta qualidade gerado.`);

      // @ts-ignore
      const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')
      if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY not configured.')
      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(generated.image_prompt)}&per_page=1&orientation=landscape`
      const unsplashResponse = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } })
      if (!unsplashResponse.ok) throw new Error('Unsplash API Error')
      const unsplashData = await unsplashResponse.json()
      if (!unsplashData.results || unsplashData.results.length === 0) throw new Error('No image found on Unsplash.')
      const imageUrl = unsplashData.results[0].urls.regular
      log(`Imagem encontrada: ${imageUrl}`);

      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()
      const imagePath = `${Date.now()}-${keyword.replace(/\s+/g, '-')}.jpg`
      const { error: uploadError } = await supabaseServiceRole.storage.from('blog-images').upload(imagePath, imageBlob, { contentType: 'image/jpeg' })
      if (uploadError) throw new Error(`Storage Upload Error: ${uploadError.message}`)
      const { data: publicUrlData } = supabaseServiceRole.storage.from('blog-images').getPublicUrl(imagePath)
      const finalImageUrl = publicUrlData.publicUrl
      log(`Imagem salva: ${finalImageUrl}`);

      const { data: newRecord, error: insertError } = await supabaseServiceRole
        .from('content_drafts')
        .insert({
          title: generated.title,
          meta_description: generated.meta_description,
          content: generated.content_html,
          featured_image_url: finalImageUrl,
          image_alt_text: generated.image_alt_text,
          image_prompt: generated.image_prompt,
          secondary_keywords: generated.secondary_keywords,
          internal_links: generated.internal_links,
          external_links: generated.external_links,
          status: 'draft',
          keyword: keyword,
          context: context,
          audience: audience,
          model: 'gpt-4o'
        })
        .select('id')
        .single()
      if (insertError) throw new Error(`Database Insert Error: ${insertError.message}`)
      log(`Rascunho salvo com ID: ${newRecord.id}`);

      return new Response(JSON.stringify({ success: true, draftId: newRecord.id }), { headers: corsHeaders, status: 200 })

    } else if (action === 'reanalyze') {
      // --- LÓGICA DE REANÁLISE DE SEO ---
      const { draft, wordCount } = payload
      if (!draft || !draft.content) throw new Error('Draft content is required for reanalysis.')
      log(`Reanalyzing SEO for draft ID: ${draft.id}`);

      const reanalyzePrompt = `
        Você é um analista de SEO. Analise o seguinte artigo HTML e forneça um feedback.
        Tópico Principal: "${draft.keyword}"
        Contagem de Palavras: ${wordCount}

        Artigo:
        ${draft.content.replace(/<[^>]*>/g, ' ').substring(0, 4000)}

        Com base na análise, retorne um objeto JSON com a seguinte estrutura:
        {
          "seo_score": um número de 0 a 100,
          "readability_score": uma string como "Bom" ou "Precisa Melhorar",
          "suggestions": ["uma", "lista", "de", "3", "sugestões práticas para melhorar o SEO e a legibilidade"]
        }
      `
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: reanalyzePrompt }], response_format: { type: 'json_object' } }),
      })
      if (!openaiResponse.ok) throw new Error(`OpenAI Reanalysis Error: ${await openaiResponse.text()}`)
      const openaiData = await openaiResponse.json()
      const analysisResult = JSON.parse(openaiData.choices[0].message.content)
      log(`Reanálise concluída.`);

      return new Response(JSON.stringify({ success: true, data: analysisResult }), { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida.' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    log(`Falha na execução: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 })
  }
})