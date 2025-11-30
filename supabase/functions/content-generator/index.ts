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

// Helper para injetar contexto local real e rico
const getLocalContext = (city: string) => {
  const contexts: Record<string, string> = {
    'Maputo': 'bairros movimentados como Polana Cimento, Alto Maé, Coop, Malhangalene e Sommerschield',
    'Matola': 'zonas industriais e residenciais como Machava, Liberdade, Matola Rio, Fomento e Mussumbuluco',
    'Beira': 'áreas costeiras e centrais como Macuti, Ponta Gêa, Manga, Munhava e Chaimite',
    'Nampula': 'bairros comerciais como Muahivire, Namicopo, Carrupeia e a zona de Cimento',
    'Tete': 'bairros como Chingodzi, Matundo e a zona da Ponte Samora Machel',
    'Quelimane': 'zonas próximas à Marginal, Sagrada Família e o centro da cidade das bicicletas',
    'Chimoio': 'bairros como Vila Nova, 7 de Abril e a zona do Cabeça do Velho',
    'Xai-Xai': 'zonas da Praia, Marien Ngouabi e a parte baixa da cidade',
    'Inhambane': 'bairros históricos como Balane e Liberdade',
    'Pemba': 'zonas turísticas de Wimbe, Chuiba e o centro expandido de Alto Gingone'
  };
  return contexts[city] || 'todas as zonas e bairros da cidade';
}

// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[CONTENT-ORCHESTRATOR] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  const token = authHeader.replace('Bearer ', '')

  try {
    const { action, ...payload } = await req.json()
    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured.')

    // --- NOVA AÇÃO: GERAR GANCHO CURTO ---
    if (action === 'generate_hook') {
      const { topic } = payload;
      
      const prompt = `
        Crie uma frase de impacto EXTREMAMENTE CURTA (máximo 3 palavras) para um assunto de e-mail de vendas em Moçambique.
        Tópico: ${topic || 'Oferta Especial'}.
        Estilo: Urgente, Emocionante, Vendedor.
        Exemplos: "Corre Aproveitar", "Só Hoje", "Baixou Tudo", "Imperdível Agora".
        
        Retorne APENAS o texto da frase, sem aspas, sem explicações.
      `;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ 
            model: 'gpt-4o-mini', 
            messages: [{ role: 'user', content: prompt }], 
            temperature: 0.9,
            max_tokens: 10
        }),
      });

      if (!openaiResponse.ok) {
          const err = await openaiResponse.json();
          throw new Error(`OpenAI Error: ${err.error?.message}`);
      }

      const data = await openaiResponse.json();
      const hook = data.choices[0].message.content.trim().replace(/^"|"$/g, ''); // Remove aspas extras
      
      return new Response(JSON.stringify({ success: true, hook }), { headers: corsHeaders, status: 200 });
    }

    // --- AÇÃO: GERAR LEGENDA SOCIAL ---
    if (action === 'generate_social_caption') {
        const { productName, productDescription, price, platform } = payload;
        
        const prompt = `
            Atue como um Especialista em Marketing Digital focado em Moçambique.
            Crie uma legenda viral para vender o seguinte produto:
            Produto: ${productName}
            Descrição Base: ${productDescription}
            Preço: ${price} MZN
            Plataforma Alvo: ${platform} (Facebook/Instagram/WhatsApp)
            
            REGRAS OBRIGATÓRIAS:
            1. Use emojis chamativos (🔥, 🚀, 🇲🇿, 📦).
            2. Enfatize: "Pagamento na Entrega" e "Frete Grátis".
            3. Crie senso de urgência ("Estoque limitado", "Oferta relâmpago").
            4. Inclua hashtags populares em Moçambique (#Maputo, #Mocambique, #VendasOnline).
            5. O tom deve ser entusiasmado e confiável.
            
            Retorne APENAS um JSON no formato: { "caption": "texto do post aqui...", "hashtags": "#tags..." }
        `;
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({ 
                model: 'gpt-4o-mini', 
                messages: [{ role: 'user', content: prompt }], 
                response_format: { type: 'json_object' },
                temperature: 0.8 // Mais criativo
            }),
        });

        if (!openaiResponse.ok) {
            const err = await openaiResponse.json();
            throw new Error(`OpenAI Error: ${err.error?.message}`);
        }

        const data = await openaiResponse.json();
        return new Response(JSON.stringify({ success: true, data: JSON.parse(data.choices[0].message.content) }), { headers: corsHeaders, status: 200 });
    }

    if (action === 'generate') {
      const { keyword, context, audience, type } = payload
      const localNuance = getLocalContext(context);
      
      log(`Starting SEO Domination generation for: "${keyword}" in ${context}`);

      const prompt = `
        **IDENTIDADE:** Você é um Especialista Sênior em SEO e Copywriting para o mercado de Moçambique.
        **OBJETIVO:** Criar um artigo autoritário, longo e altamente relevante para dominar a busca: "${keyword}".
        **LOCALIZAÇÃO:** ${context} (Incorpore referências a: ${localNuance}).
        **PÚBLICO:** ${audience}.
        **TOM DE VOZ:** Profissional, útil, persuasivo e local (PT-MZ).

        **REQUISITOS CRÍTICOS DE CONTEÚDO (NÃO IGNORE):**
        1. **EXTENSÃO:** O artigo DEVE ter no mínimo **800 palavras**. Desenvolva cada parágrafo com profundidade.
        2. **LINKS INTERNOS:** Você DEVE inserir organicamente no HTML os seguintes links (pelo menos 3 vezes no texto):
           - <a href="https://lojarapidamz.com/register">começar a vender na LojaRápida</a>
           - <a href="https://lojarapidamz.com/produtos">ver ofertas disponíveis</a>
           - <a href="https://lojarapidamz.com/lojas">encontrar vendedores em ${context}</a>
        3. **FORMATO:** HTML limpo (apenas tags de corpo: <h2>, <h3>, <p>, <ul>, <li>, <strong>). Não use markdown, não use tags <html> ou <body>.

        **ESTRUTURA DO ARTIGO:**
        1. **Introdução Cativante:** Aborde a dor do cliente (ex: dificuldade de achar ${keyword} em ${context}) e apresente a solução (comprar online seguro).
        2. **H2: O Panorama do Mercado de ${keyword} em ${context}:** Fale sobre disponibilidade, preços médios em Meticais e onde as pessoas costumam ir (${localNuance}).
        3. **H2: Por que Comprar Online é Mais Seguro e Prático:** Foco total no **Pagamento na Entrega** (evita burlas) e entrega ao domicílio (evita chapa/trânsito).
        4. **H2: Guia Passo-a-Passo para Encomendar na LojaRápida:** Explique como funciona.
        5. **H2: Oportunidade para Vendedores:** Se você vende ${keyword}, explique por que devem se cadastrar.
        6. **H2: Perguntas Frequentes (FAQ):** Crie 3 perguntas e respostas relevantes sobre ${keyword}.
        7. **Conclusão:** Resumo e Call-to-Action forte.

        **SAÍDA JSON OBRIGATÓRIA:**
        {
          "title": "Título SEO Otimizado (Ex: Guia Completo: Onde Comprar [Keyword] em [Cidade])",
          "meta_description": "Resumo atrativo com foco local e Call-to-Action. Máx 160 chars.",
          "content_html": "O conteúdo HTML completo e extenso aqui...",
          "image_prompt": "Fotografia profissional de ${keyword.replace('comprar ', '').replace('vender ', '')} em um contexto moderno, iluminação de estúdio, alta resolução",
          "image_alt_text": "${keyword} disponível para entrega em ${context}",
          "secondary_keywords": ["${context} vendas online", "loja ${context}", "preço ${keyword} mzn", "pagamento na entrega moçambique"]
        }
      `
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ 
            model: 'gpt-4o-mini', 
            messages: [{ role: 'user', content: prompt }], 
            response_format: { type: 'json_object' },
            temperature: 0.7 // Um pouco mais criativo para gerar texto mais longo
        }),
      })

      if (!openaiResponse.ok) throw new Error(`OpenAI API Error`);

      const openaiData = await openaiResponse.json()
      const generated = JSON.parse(openaiData.choices[0].message.content)

      // --- GERAÇÃO DE IMAGEM OTIMIZADA (Unsplash) ---
      // @ts-ignore
      const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')
      let finalImageUrl = null;

      if (UNSPLASH_ACCESS_KEY) {
        try {
            // Lógica de Limpeza de Query para Imagem
            let imageQuery = keyword
                .toLowerCase()
                .replace('comprar', '')
                .replace('vender', '')
                .replace('alugar', '')
                .replace('melhores', '')
                .replace('preço', '')
                .replace(' em ', ' ')
                .replace(context.toLowerCase(), '')
                .trim();

            if (imageQuery.length < 3) imageQuery = "shopping africa market";
            
            log(`Searching Unsplash for: "${imageQuery}"`);

            const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(imageQuery)}&per_page=1&orientation=landscape&content_filter=high`
            const unsplashResponse = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } })
            
            if (unsplashResponse.ok) {
                const unsplashData = await unsplashResponse.json()
                if (unsplashData.results && unsplashData.results.length > 0) {
                    finalImageUrl = unsplashData.results[0].urls.regular
                } else {
                    finalImageUrl = "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1000&q=80"
                }
            }
        } catch (imgError) {
            log(`Image generation skipped: ${imgError.message}`);
        }
      }
      
      // Inserção no Banco
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
          status: 'draft',
          keyword: keyword,
          context: context,
          audience: audience,
          seo_score: 85, 
          readability_score: 'Bom',
          model: 'gpt-4o-mini-seo-matrix-v2'
        })
        .select('id')
        .single()

      if (insertError) throw new Error(`Database Insert Error: ${insertError.message}`)

      return new Response(JSON.stringify({ success: true, draftId: newRecord.id }), { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida.' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    log(`Falha na execução: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 })
  }
})