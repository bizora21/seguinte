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

// Usando a chave da OpenAI para todas as chamadas
const OPENAI_TEXT_API_URL = 'https://api.openai.com/v1/chat/completions'
// @ts-ignore
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

// Função auxiliar para chamar a API de texto da OpenAI
// @ts-ignore
async function callOpenAITextApi(prompt: string, model: string = 'gpt-4o-mini') {
    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY não configurada nos secrets.");
    }
    
    const response = await fetch(OPENAI_TEXT_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096,
            temperature: 0.7,
            response_format: { type: "json_object" } // Pedindo JSON estruturado
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Falha na API da OpenAI (Texto): ${response.status} - ${errorBody.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    
    try {
        // Tenta parsear o JSON
        return JSON.parse(rawText);
    } catch (e) {
        console.error("Erro ao parsear JSON da OpenAI:", e);
        throw new Error("A OpenAI não retornou o JSON estruturado corretamente.");
    }
}

// Função auxiliar para chamar a API DALL-E (mantida)
// @ts-ignore
async function callDalleApi(prompt: string) {
    if (!OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY não configurada. Pulando geração de imagem.");
        return null;
    }
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            response_format: 'url',
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error(`Falha na API DALL-E: ${response.status} - ${errorBody.error?.message || 'Erro desconhecido'}`);
        return null; // Retorna null em caso de falha na API de imagem
    }

    const data = await response.json();
    return data.data?.[0]?.url || null;
}


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
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  
  if (!keyword) {
      return new Response(JSON.stringify({ error: 'Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
  }

  try {
    console.log(`Gerando conteúdo para: ${keyword}`)
    
    // --- PROMPT OTIMIZADO PARA VELOCIDADE ---
    const promptAvancado = `
Crie um artigo de blog para a LojaRápida (marketplace de Moçambique). Adote um tom humano, conversacional e de especialista moçambicano.

Foco: "${keyword}". Contexto: ${context}. Público: ${audience}. Tipo: ${type}.

Instruções:
1. Gere APENAS o conteúdo final, sem rótulos ou explicações.
2. Use referências locais de Moçambique (cidades, cultura).
3. Formate com markdown (**negrito**, *itálico*). Links: [texto](URL).
4. Estrutura: Título H1, Intro, Corpo (min 1200 palavras, H2/H3, listas), Conclusão com CTA.
5. SEO: Otimize para "${keyword}" e secundárias: "vender online em Moçambique", "empreendedorismo moçambicano". Crie uma meta descrição (max 160 chars).

Retorne um único objeto JSON, estritamente no formato:
{
  "title": "O título H1 do artigo aqui",
  "meta_description": "A meta descrição (até 160 caracteres) aqui",
  "content": "O artigo completo em markdown aqui.",
  "image_prompt": "Um prompt detalhado em inglês para uma imagem de destaque.",
  "secondary_keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
  "external_links": [{"title": "Exemplo", "url": "https://example.com"}],
  "internal_links": [{"title": "Exemplo", "url": "/exemplo"}],
  "suggested_category": "Nome da Categoria Sugerida",
  "seo_score": 90,
  "readability_score": "Excelente"
}
`;
    // --- FIM DO PROMPT OTIMIZADO ---

    // --- PASSO 1: Geração do Artigo Principal (Usando OpenAI) ---
    const articleData = await callOpenAITextApi(promptAvancado);

    // --- PASSO 2: Geração do Prompt de Imagem (Já incluído no JSON) ---
    const imagePrompt = articleData.image_prompt;
    let generatedImageUrl = null;

    // --- PASSO 3: Geração da Imagem (DALL-E) ---
    if (imagePrompt) {
        generatedImageUrl = await callDalleApi(imagePrompt);
    }

    // --- PASSO 4: Estruturação da Resposta Final ---
    // Acessando secondary_keywords de forma segura e garantindo que é um array antes de chamar join
    const secondaryKeywordsArray = Array.isArray(articleData.secondary_keywords) ? articleData.secondary_keywords : [];
    
    const finalResponse = {
        ...articleData,
        image_prompt: imagePrompt,
        featured_image_url: generatedImageUrl, // Adiciona a URL da imagem gerada
        secondary_keywords: secondaryKeywordsArray.join(', ') // Converte para string para o frontend
    };
    
    return new Response(JSON.stringify({ data: finalResponse }), {
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    // Retorna 500 com a mensagem de erro para o frontend
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})