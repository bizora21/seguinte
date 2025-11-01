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
        throw new Error("GLM_API_KEY não configurada.");
    }
    
    // Simulação de chamada real (com a URL correta da GLM)
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

    // --- SIMULAÇÃO DE CHAMADA À GLM (Substituir por callGlmApi(promptAvancado)) ---
    // Definindo o tipo do mock para incluir secondary_keywords como array
    const articleData = {
        title: `Guia Definitivo: Como Vender ${keyword} Online em Moçambique e Multiplicar Seus Lucros`,
        meta_description: `Descubra as melhores estratégias para vender ${keyword} online em Moçambique. Guia completo com dicas de logística, pagamento na entrega e SEO local.`,
        content: `
# Guia Definitivo: Como Vender **${keyword}** Online em Moçambique e Multiplicar Seus Lucros

O mercado de **${keyword}** em Moçambique está em plena expansão. Se você é um empreendedor moçambicano, este é o momento de levar seu negócio para o digital. A LojaRápida oferece a plataforma ideal para você **vender online em Moçambique** com segurança e eficiência.

## 1. Entendendo o Consumidor Moçambicano

O consumidor em Maputo, Matola e Beira valoriza a confiança. É por isso que o modelo de Pagamento na Entrega (COD) é crucial.

### 1.1. A Importância do Pagamento na Entrega
A maioria dos clientes prefere pagar apenas ao receber o produto. Isso elimina a barreira de confiança e acelera a decisão de compra.

## 2. Estratégias de Logística e Entrega

Para **crescer negócio** em Moçambique, a logística deve ser impecável.

*   **Embalagem:** Use embalagens resistentes para proteger seus **${keyword}** durante o transporte.
*   **Rastreamento:** Mantenha o cliente informado sobre o status do pedido.

## 3. Otimização de Produtos na LojaRápida

Para garantir que seus produtos sejam encontrados, siga estas dicas de SEO:

1.  **Título:** Use a palavra-chave principal (ex: **${keyword}**) no título.
2.  **Descrição:** Seja detalhado. Mencione a garantia e as especificações técnicas.
3.  **Imagens:** Use fotos de alta qualidade.

## Conclusão

Vender **${keyword}** online em Moçambique nunca foi tão fácil. Com a plataforma certa e as estratégias de **empreendedorismo moçambicano** corretas, você pode alcançar clientes em todas as províncias.

[CTA: Comece a Vender Agora na LojaRápida](https://lojarapidamz.com/register)
`,
        external_links: [
            { title: 'Estatísticas de E-commerce em África', url: 'https://example.com/africa-ecommerce' },
            { title: 'Guia de Pagamentos M-Pesa', url: 'https://example.com/mpesa-guide' }
        ],
        internal_links: [
            { title: 'Ver Produtos de Tecnologia', url: '/produtos?categoria=eletronicos' },
            { title: 'Política do Vendedor', url: '/politica-vendedor' }
        ],
        suggested_category: 'E-commerce e Vendas Online',
        seo_score: 92,
        readability_score: 'Excelente',
        image_prompt: `A high-quality, professional photograph of a successful Mozambican entrepreneur in Maputo, standing proudly next to a display of modern ${keyword} products. The scene is brightly lit with natural light, clean background, shallow depth of field. The entrepreneur is smiling and wearing business casual attire. Negative prompt: text, logos, blurry, low resolution, cartoon, watermark.`,
        secondary_keywords: ['vender online em Moçambique', 'empreendedorismo moçambicano', 'crescer negócio']
    };
    // --- FIM DA SIMULAÇÃO ---

    // --- PASSO 2: Geração do Prompt de Imagem (Já incluído no JSON simulado) ---
    const imagePrompt = articleData.image_prompt;
    let generatedImageUrl = null;

    // --- PASSO 3: Geração da Imagem (Simulação) ---
    if (OPENAI_API_KEY && imagePrompt) {
        // Lógica para chamar a API DALL-E 3 (ou outra)
        // generatedImageUrl = imageData.data[0].url;
        
        // MOCK: Retorna uma URL de imagem baseada no prompt
        generatedImageUrl = `https://picsum.photos/seed/${encodeURIComponent(imagePrompt.substring(0, 50))}/1200/675`;
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