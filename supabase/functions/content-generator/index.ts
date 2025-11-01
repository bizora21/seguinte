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

// URL da API da GLM (Simulação)
const GLM_API_URL = 'https://api.glm.ai/v1/generate'
// @ts-ignore
const GLM_API_KEY = Deno.env.get('GLM_API_KEY')
// @ts-ignore
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

// Função auxiliar para chamar a API da GLM
// @ts-ignore
async function callGlmApi(prompt: string, model: string = 'glm-4') {
    if (!GLM_API_KEY) {
        throw new Error("GLM_API_KEY não configurada nos secrets.");
    }
    
    const response = await fetch(GLM_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GLM_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            max_tokens: 4096,
            temperature: 0.7,
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Falha na API da GLM: ${response.status} - ${errorBody.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    // Tenta parsear o JSON que a GLM deve retornar
    const rawText = data.choices?.[0]?.message?.content || data.text || '';
    
    try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Resposta da GLM não está no formato JSON esperado.");
    } catch (e) {
        console.error("Erro ao parsear JSON da GLM:", e);
        throw new Error("A GLM não retornou o JSON estruturado corretamente.");
    }
}

// Função auxiliar para chamar a API DALL-E
// @ts-ignore
async function callDalleApi(prompt: string) {
    if (!OPENAI_API_KEY) {
        // Se a chave estiver faltando, retornamos null para que o processo continue sem imagem
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
    
    // --- PROMPT AVANÇADO HUMANIZADO ---
    const promptAvancado = `
Você é um jornalista moçambicano, especialista em SEO e contador de histórias. Sua missão é escrever um artigo para o blog da LojaRápida que seja tão humano e envolvente que o leitor sentirá que foi escrito por um amigo.

Palavra-chave principal: "${keyword}"

**REGRAS CRÍTICAS:**

1.  **NÃO INCLUA RÓTULOS:** Gere APENAS o conteúdo final. NÃO inclua no seu retorno textos como "Título:", "Introdução:", "Corpo do Texto:", "Meta Descrição:", etc. O sistema se encarrega de separar os campos.

2.  **Humanização Absoluta:** Escreva como se estivesse contando uma história para um amigo. Use uma linguagem que soa como uma conversa, com frases mais curtas em alguns momentos e mais longas em outros. Use referências a cidades, culturas e a realidade de Moçambique para criar conexão. Evite uma estrutura formal de ensaio.

3.  **Formatação:** Use markdown para negrito (**palavra**) e itálico (*palavra*). Integre os links diretamente no texto, no formato [texto âncora](URL).

4.  **Estrutura de Conteúdo:**
    - Crie um título (H1) que seja pergunta e promessa.
    - Escreva uma introdução com um gancho forte.
    - Desenvolva o corpo com subtítulos (H2, H3), listas e parágrafos profundos (mínimo 1200 palavras).
    - Termine com uma conclusão poderosa e um CTA para a LojaRápida.

5.  **SEO:** Use a palavra-chave "${keyword}" de forma natural. Inclua as palavras-chave secundárias: "vender online em Moçambique", "empreendedorismo moçambicano", "crescer negócio".

**FORMATO DE SAÍDA OBRIGATÓRIO:**
Retorne suas respostas em um único objeto JSON estruturado exatamente como abaixo. Se um campo não for aplicável, retorne uma string vazia "".

{
  "title": "O título H1 do artigo aqui",
  "meta_description": "A meta descrição (até 160 caracteres) aqui",
  "content": "O artigo completo em markdown aqui, com títulos, links, etc.",
  "image_prompt": "Um prompt detalhado em inglês para uma imagem de destaque sobre o tema do artigo.",
  "secondary_keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
  "external_links": [{"title": "Exemplo", "url": "https://example.com"}],
  "internal_links": [{"title": "Exemplo", "url": "/exemplo"}],
  "suggested_category": "Nome da Categoria Sugerida",
  "seo_score": 90,
  "readability_score": "Excelente"
}
`;
    // --- FIM DO PROMPT AVANÇADO HUMANIZADO ---

    // --- PASSO 1: Geração do Artigo Principal ---
    const articleData = await callGlmApi(promptAvancado);

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
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})