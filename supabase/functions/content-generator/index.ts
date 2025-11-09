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
      const { keyword, context, audience, type } = payload
      if (!keyword) throw new Error('Keyword is required.')
      log(`Starting full generation for: "${keyword}"`);

      // 🔥 CORREÇÃO: Buscar artigos existentes para usar como links internos válidos
      const { data: existingArticles, error: articlesError } = await supabaseServiceRole
        .from('published_articles')
        .select('title, slug')
        .eq('status', 'published');
      
      let existingArticlesText = "Nenhum artigo publicado encontrado.";
      if (existingArticles && existingArticles.length > 0) {
        existingArticlesText = existingArticles.map(a => `- Título: "${a.title}", URL: /blog/${a.slug}`).join('\n');
      }

      const prompt = `
        **INSTRUÇÃO CRÍTICA E INEGOCIÁVEL**

        Você é um copywriter sênior e estratega de SEO para o mercado de Moçambique. Sua missão é produzir um artigo de classe mundial, 100% humanizado, e otimizado para SEO sobre o tópico: "${keyword}".

        **Público-Alvo:** "${audience}"
        **Contexto Local:** "${context}"
        **Formato do Artigo:** "${type}"

        **REGRAS ABSOLUTAS QUE NÃO PODEM SER IGNORADAS:**

        1.  **NÃO REPITA O TÍTULO NA INTRODUÇÃO:** O campo \`content_html\` **NÃO DEVE** começar com uma tag \`<h1>\`. O artigo deve começar diretamente com o primeiro parágrafo da introdução. O título pertence apenas ao campo \`title\`.

        2.  **CONTEÚDO PROFUNDO E HUMANIZADO (MÍNIMO 1200 PALAVRAS):**
            *   Escreva como um especialista humano para outro humano. Use um tom conversacional e envolvente.
            *   Forneça insights práticos, exemplos locais de Moçambique e conselhos acionáveis.
            *   Estruture o artigo de forma lógica: introdução cativante, desenvolvimento com subtítulos (<h2>, <h3>), e uma conclusão forte.
            *   A profundidade e a qualidade são mais importantes que a contagem de palavras, mas o mínimo absoluto é 1200 palavras.

        3.  **FORMATO HTML PERFEITO:** O campo \`content_html\` deve ser um HTML válido, usando apenas as tags <p>, <h2>, <h3>, <ul>, <li>, e <strong>.

        4.  **LINKS INTERNOS VÁLIDOS:** A partir da lista de artigos existentes fornecida abaixo, escolha 1 ou 2 que sejam MAIS RELEVANTES para o tópico atual e use-os para o campo \`internal_links\`. **NÃO INVENTE links ou URLs.** Se nenhum for relevante, retorne uma lista vazia.
            **Artigos Existentes:**
            ${existingArticlesText}

        5.  **SEO COMPLETO E OTIMIZADO:** Todos os campos do JSON de saída devem ser preenchidos com qualidade profissional.

        **ESTRUTURA DE SAÍDA (JSON OBRIGATÓRIO):**

        Sua resposta DEVE ser um único objeto JSON, sem qualquer texto adicional antes ou depois.

        {
          "title": "Um título H1 otimizado para SEO (60-70 caracteres), magnético e que gere cliques.",
          "meta_description": "Uma meta descrição otimizada e persuasiva (150-160 caracteres) que incentive o clique no SERP.",
          "content_html": "O artigo completo em HTML (mínimo 1200 palavras), começando com um parágrafo, não com um título.",
          "image_prompt": "Um prompt curto e descritivo em INGLÊS para o Unsplash. Ex: 'young mozambican entrepreneur working on a laptop in a modern Maputo office'.",
          "image_alt_text": "Um texto alternativo (ALT text) para a imagem, em PORTUGUÊS, descritivo e otimizado para SEO.",
          "secondary_keywords": ["uma", "lista", "de", "5", "palavras-chave LSI relevantes e semânticas"],
          "internal_links": [{ "title": "Título do Artigo Existente Escolhido", "url": "/blog/slug-do-artigo-existente" }],
          "external_links": [{ "title": "Nome de um Site de Referência de Alta Autoridade", "url": "https://exemplo.com" }],
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
      
      const sanitizedTitle = (generated.title || keyword)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      const imagePath = `${Date.now()}-${sanitizedTitle}.jpg`
      
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
      const { draft, wordCount } = payload
      if (!draft || !draft.content) throw new Error('Draft content is required for reanalysis.')
      log(`Reanalyzing SEO for draft ID: ${draft.id}`);

      const reanalyzePrompt = `
        **INSTRUÇÃO CRÍTICA: VOCÊ É UM ESTRATEGA DE SEO DE CLASSE MUNDIAL**

        Sua especialidade é o mercado de Moçambique. Analise o seguinte rascunho de artigo com um olhar crítico e profissional.

        **Tópico Principal (Palavra-chave):** "${draft.keyword}"
        **Contagem de Palavras Atual:** ${wordCount}

        **Texto do Artigo (parcial):**
        ${draft.content.replace(/<[^>]*>/g, ' ').substring(0, 4000)}

        **SUA TAREFA:**

        1.  **Calcule um SEO Score (0-100):** Baseie-se na otimização on-page, uso de palavras-chave, estrutura e potencial de E-E-A-T.
        2.  **Avalie a Legibilidade:** Classifique como "Excelente", "Bom", "Razoável" ou "Precisa Melhorar".
        3.  **Forneça 3 SUGESTÕES ACIONÁVEIS E ESPECÍFICAS:** As sugestões devem ser concretas e ir além do óbvio ("adicione mais palavras-chave"). Dê exemplos.

            *   **Exemplo de sugestão RUIM:** "Adicione mais links."
            *   **Exemplo de sugestão BOA:** "Na seção sobre 'métodos de pagamento', adicione um link interno para um possível artigo futuro sobre 'como usar M-Pesa em Moçambique' para aumentar a profundidade do tópico."
            *   **Exemplo de sugestão BOA:** "Para aumentar a autoridade (E-E-A-T), cite dados do Instituto Nacional de Estatística (INE) de Moçambique sobre o crescimento do e-commerce no país."

        **ESTRUTURA DE SAÍDA (JSON OBRIGATÓRIO):**

        Sua resposta DEVE ser um único objeto JSON, sem qualquer texto adicional.

        {
          "seo_score": um número inteiro de 0 a 100,
          "readability_score": uma string ("Excelente", "Bom", "Razoável", "Precisa Melhorar"),
          "suggestions": [
            "Primeira sugestão específica e acionável.",
            "Segunda sugestão específica e acionável.",
            "Terceira sugestão específica e acionável."
          ]
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