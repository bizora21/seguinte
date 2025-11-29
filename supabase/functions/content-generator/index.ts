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

// Helper para injetar contexto local real
const getLocalContext = (city: string) => {
  const contexts: Record<string, string> = {
    'Maputo': 'bairros como Polana, Alto Maé, Coop e Sommerschield',
    'Matola': 'zonas como Machava, Liberdade, Matola Rio e Fomento',
    'Beira': 'áreas como Macuti, Ponta Gêa, Manga e Munhava',
    'Nampula': 'bairros como Muahivire, Namicopo e zona de Cimento',
    'Tete': 'bairros como Chingodzi e Matundo',
    'Quelimane': 'zonas próximas à Marginal e Sagrada Família',
    'Chimoio': 'bairros como Vila Nova e 7 de Abril',
    'Xai-Xai': 'zonas da Praia e Marien Ngouabi',
    'Inhambane': 'bairros Balane e Liberdade',
    'Pemba': 'zonas de Wimbe, Chuiba e Alto Gingone'
  };
  return contexts[city] || 'todas as zonas da cidade';
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

    // --- NOVA AÇÃO: GERAR LEGENDA SOCIAL ---
    if (action === 'generate_social_caption') {
        // ... (código existente mantido para social) ...
        const { productName, productDescription, price, platform } = payload;
        const prompt = `ATUE COMO: Especialista em Marketing Digital Moçambicano. Venda: ${productName} (${price} MZN). Descrição: ${productDescription}. Plataforma: ${platform}. Foco: Pagamento na Entrega. JSON output: { "caption": "...", "hashtags": "..." }`;
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
        });
        const data = await openaiResponse.json();
        return new Response(JSON.stringify({ success: true, data: JSON.parse(data.choices[0].message.content) }), { headers: corsHeaders, status: 200 });
    }

    if (action === 'generate') {
      const { keyword, context, audience, type } = payload
      const localNuance = getLocalContext(context);
      
      log(`Starting SEO Domination generation for: "${keyword}" in ${context}`);

      const prompt = `
        **FUNÇÃO:** Especialista Sênior em SEO Local para Moçambique.
        **MISSÃO:** Criar uma página de entrada (Landing Page de Conteúdo) para dominar a busca: "${keyword}".
        **LOCALIZAÇÃO:** ${context} (Mencione ${localNuance}).
        **PÚBLICO:** ${audience}.
        **PLATAFORMA:** LojaRápida (Marketplace com Pagamento na Entrega).

        **ESTRUTURA DE CONTEÚDO (HTML OTIMIZADO):**
        1. **H2: Onde encontrar ${keyword.replace('comprar ', '').replace(' em ' + context, '')} em ${context}?**
           - Explique que a LojaRápida conecta vendedores de ${context} diretamente com compradores.
           - Mencione a facilidade de entrega nos bairros locais (${localNuance}).
        2. **H2: Vantagens de comprar online em ${context}**
           - Fale sobre evitar o trânsito/calor.
           - Foco total em **Pagamento na Entrega** (segurança).
        3. **H2: Preços médios de ${keyword} em Moçambique**
           - Dê uma estimativa realista em Meticais (MZN).
        4. **H2: Como vender ${keyword} na LojaRápida**
           - Convide vendedores locais de ${context} a se cadastrarem.
        5. **H3: Conclusão**
           - Chamada para ação forte (Comprar ou Vender agora).

        **REGRAS DE SEO:**
        - Repita a palavra-chave "${keyword}" pelo menos 3 vezes de forma natural.
        - Use negrito (<strong>) para termos locais e benefícios.
        - O texto deve ter entre 600 a 1000 palavras (focado e denso).

        **SAÍDA JSON OBRIGATÓRIA:**
        {
          "title": "Título SEO Otimizado (Ex: Melhores Ofertas de [Produto] em [Cidade])",
          "meta_description": "Descrição atrativa com foco local e Call-to-Action. Máx 160 chars.",
          "content_html": "Conteúdo HTML completo (tags <p>, <h2>, <h3>, <ul>, <li>).",
          "image_prompt": "Imagem realista de alguém usando/segurando ${keyword} em um cenário urbano africano moderno, luz natural",
          "image_alt_text": "${keyword} disponível para entrega imediata",
          "secondary_keywords": ["${context} vendas", "loja online ${context}", "preço ${keyword} mzn"]
        }
      `
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ 
            model: 'gpt-4o-mini', // Modelo rápido e eficiente para volume
            messages: [{ role: 'user', content: prompt }], 
            response_format: { type: 'json_object' },
            temperature: 0.6 
        }),
      })

      if (!openaiResponse.ok) throw new Error(`OpenAI API Error`);

      const openaiData = await openaiResponse.json()
      const generated = JSON.parse(openaiData.choices[0].message.content)

      // --- GERAÇÃO DE IMAGEM (Unsplash) ---
      // @ts-ignore
      const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')
      let finalImageUrl = null;

      if (UNSPLASH_ACCESS_KEY) {
        try {
            // Busca mais genérica para garantir resultados
            const searchTerms = keyword.replace('comprar ', '').replace('vender ', '').replace(/ em .*/, '');
            const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerms)}&per_page=1&orientation=landscape`
            const unsplashResponse = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } })
            
            if (unsplashResponse.ok) {
                const unsplashData = await unsplashResponse.json()
                if (unsplashData.results && unsplashData.results.length > 0) {
                    finalImageUrl = unsplashData.results[0].urls.regular
                }
            }
        } catch (imgError) {
            log(`Image generation skipped: ${imgError.message}`);
        }
      }
      
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
          model: 'gpt-4o-mini-seo-matrix'
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