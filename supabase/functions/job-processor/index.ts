// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Inicializa o cliente Supabase com SERVICE_ROLE_KEY para operações de backend
// @ts-ignore
const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // CHAVE DE SERVIÇO
  {
    auth: {
      persistSession: false,
    },
  },
)

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
            temperature: 0.8, // Aumentado para mais criatividade/humanização
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Falha na API da OpenAI (Texto): ${response.status} - ${errorBody.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    
    try {
        return JSON.parse(rawText);
    } catch (e) {
        console.error("Erro ao parsear JSON da OpenAI:", e);
        throw new Error("A OpenAI não retornou o JSON estruturado corretamente.");
    }
}

// Função principal de processamento
// @ts-ignore
async function processJob(jobId: string, payload: any) {
    const { keyword, context, audience, type } = payload;
    
    // 1. Atualizar status para 'processing' usando SERVICE ROLE
    await supabaseServiceRole.from('generation_jobs').update({ status: 'processing', progress: 10 }).eq('id', jobId);

    try {
        // --- PROMPT AVANÇADO PARA HUMANIZAÇÃO ---
        const PROFESSIONAL_PROMPT = `
Você é um jornalista sênior moçambicano com 15 anos de experiência em redação para web e SEO.

MISSÃO: Escrever um artigo EXCEPCIONAL sobre "${keyword}" que seja:
- Indistinguível de conteúdo humano (passe em detectores de IA)
- Engajante do início ao fim
- Otimizado para SEO sem parecer robótico
- Com personalidade, humor sutil e storytelling

Foco: "${keyword}". Contexto: ${context}. Público: ${audience}. Tipo: ${type}.

ESTRUTURA OBRIGATÓRIA:

# ${keyword}: [Título Magnético que Gera Cliques]

## Introdução (Hook Poderoso)
- Comece com uma história real, estatística surpreendente ou pergunta provocativa
- Conecte emocionalmente com o leitor moçambicano
- Prometa valor claro nos próximos 3 minutos de leitura

## [3-5 Seções Principais com H2]
- Use exemplos concretos de Moçambique (Maputo, Beira, Nampula)
- Use Negrito em **conceitos-chave** (não abuse)
- Use *itálico* APENAS para ênfase sutil
- Inclua listas bullet quando apropriado

## Conclusão + CTA
- Resuma os 3 pontos principais
- Call-to-action natural e contextualizado
- Deixe o leitor inspirado a agir

FORMATAÇÃO MARKDOWN:
- SEMPRE use **texto** para negrito (NUNCA *texto* ou asterisco simples)
- Headers: # H1, ## H2, ### H3
- Links: [texto do link](URL)
- Listas: - item

RETORNE JSON:
{
  "title": "Título final otimizado",
  "meta_description": "Descrição 150-160 caracteres",
  "content": "Artigo completo em markdown aqui.",
  "image_prompt": "Um prompt detalhado em inglês para uma imagem de destaque.",
  "secondary_keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
  "external_links": [{"title": "Exemplo", "url": "https://example.com"}],
  "internal_links": [{"title": "Exemplo", "url": "/exemplo"}],
  "suggested_category": "Nome da Categoria Sugerida",
  "seo_score": 90,
  "readability_score": "Excelente"
}
`;
        // --- FIM DO PROMPT AVANÇADO ---

        // 2. Geração do Artigo Principal
        const articleData = await callOpenAITextApi(PROFESSIONAL_PROMPT);
        
        // 3. Pós-Processamento (Limpeza de asteriscos mal formatados)
        let content = articleData.content || '';
        content = content.replace(/\*([^*]+)\*/g, '**$1**'); // *texto* -> **texto**
        
        // 4. Atualizar progresso (Artigo gerado) usando SERVICE ROLE
        await supabaseServiceRole.from('generation_jobs').update({ progress: 50, partial_content: content }).eq('id', jobId);

        // 5. Geração da Imagem (Apenas retorna o prompt, não gera a imagem automaticamente)
        const imagePrompt = articleData.image_prompt;
        
        // 6. Estruturação da Resposta Final
        const secondaryKeywordsArray = Array.isArray(articleData.secondary_keywords) ? articleData.secondary_keywords : [];
        
        const finalResponse = {
            ...articleData,
            content: content,
            image_prompt: imagePrompt,
            featured_image_url: null, // Desativado: Geração manual no frontend
            secondary_keywords: secondaryKeywordsArray, // Mantém como array para o frontend
        };

        // 7. Finalizar Job usando SERVICE ROLE
        await supabaseServiceRole.from('generation_jobs').update({ 
            status: 'completed', 
            progress: 100,
            result_data: finalResponse,
            partial_content: null // Limpa o partial content
        }).eq('id', jobId);

    } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        // 8. Marcar Job como falho usando SERVICE ROLE
        await supabaseServiceRole.from('generation_jobs').update({ 
            status: 'failed', 
            error_message: error.message || 'Erro desconhecido na geração de IA' 
        }).eq('id', jobId);
    }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // Esta função não precisa de autenticação de usuário, pois usa a Service Role Key
  
  try {
    const { jobId } = await req.json();
    
    if (!jobId) {
        return new Response(JSON.stringify({ error: 'Job ID ausente' }), { status: 400, headers: corsHeaders })
    }
    
    // Buscar o job usando SERVICE ROLE
    const { data: job, error: fetchError } = await supabaseServiceRole
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single()
        
    if (fetchError || !job) {
        return new Response(JSON.stringify({ error: 'Job não encontrado' }), { status: 404, headers: corsHeaders })
    }
    
    // Processar o job (execução síncrona dentro da Edge Function)
    await processJob(jobId, job.result_data);

    return new Response(JSON.stringify({ success: true, jobId: jobId, status: 'processing_started' }), {
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    console.error('Job Processor Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})