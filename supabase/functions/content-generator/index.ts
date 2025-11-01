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

// Função auxiliar para chamar a API da GLM
// @ts-ignore
async function callGlmApi(prompt: string, model: string = 'glm-4') {
    if (!GLM_API_KEY) {
        throw new Error("GLM_API_KEY não configurada.");
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
    // Simulação: A resposta real da GLM deve ser parseada para extrair o texto
    // Assumimos que o texto está em data.choices[0].text
    const rawText = data.choices?.[0]?.text || data.text || '';
    
    // Tenta parsear o JSON que a GLM deve retornar
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
  const context = url.searchParams.get('context') || 'nacional';
  const audience = url.searchParams.get('audience') || 'geral';
  const type = url.searchParams.get('type') || 'guia-completo';
  
  // 1. Autenticação (Admin apenas)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  
  if (!keyword) {
      return new Response(JSON.stringify({ error: 'Palavra-chave ausente' }), { status: 400, headers: corsHeaders })
  }

  try {
    console.log(`Gerando conteúdo: ${keyword} | ${context} | ${audience} | ${type}`)
    
    // --- PASSO 1: Geração do Artigo Principal ---
    const promptAvancado = `
Você é um jornalista e especialista em SEO de renome internacional, contratado para escrever um artigo de altíssima qualidade para o blog da LojaRápida, um marketplace em Moçambique.

Sua tarefa é criar um artigo completo, convincente e otimizado com base na palavra-chave: "${keyword}".

Siga estas regras estritamente:

1.  **Tom e Estilo (Humanização Total):**
    - Escreva de forma extremamente natural e humana. Use uma variedade de estruturas de frases.
    - **NUNCA use asteriscos (*) para palavras em negrito ou itálico; use formatação markdown como **palavra** ou *palavra*.**
    - Evite clichês e frases feitas. O texto deve fluir de forma orgânica.
    - Use exemplos, cidades e referências que ressoem com o público de Moçambique (ex: Maputo, Matola, Beira, o Metical, etc.).

2.  **Estrutura do Artigo:**
    - **Título (H1):** Crie um título que seja pergunta e promessa, instigante e que inclua a palavra-chave.
    - **Introdução:** Comece com um gancho forte, conectando-se com um problema ou desejo real do público moçambicano.
    - **Corpo do Texto (mínimo 1200 palavras):**
        - Divida o texto em seções claras com subtítulos (H2 e H3).
        - Use listas com bullet points para facilitar a leitura.
        - Inclua pelo menos 3 "dicas práticas" ou "passos" que o leitor possa seguir.
    - **Conclusão:** Termine com uma mensagem poderosa e um chamado para a ação (CTA) claro.

3.  **Integração de Links (Dentro do Texto):**
    - **Integre os links diretamente no corpo do artigo usando o formato de markdown [texto âncora](URL).**
    - Exemplo: "...como explicado neste guia do [Institute of Mozambique](https://example.com), os empreendedores devem..."
    - Exemplo: "...confira nossos [produtos de tecnologia](https://lojarapidamz.com/produtos?categoria=eletronicos) para mais opções."

4.  **Otimização para SEO:**
    - Insira a palavra-chave "${keyword}" de forma natural no título, na introdução, em pelo menos um subtítulo e na conclusão.
    - Inclua estas palavras-chave secundárias: "vender online em Moçambique", "empreendedorismo moçambicano", "crescer negócio".
    - Crie uma meta descrição com no máximo 160 caracteres.

5.  **Formato de Saída:** Retorne todo o conteúdo em um único objeto JSON com as seguintes chaves: "title", "meta_description", "content", "external_links", "internal_links", "suggested_category", "seo_score", "readability_score".

Agora, gere o artigo.
`;
    
    // Simulação de chamada à GLM (Substituir por callGlmApi(promptAvancado))
    // const articleData = await callGlmApi(promptAvancado);
    
    // MOCK DE DADOS PARA TESTE SEM CHAVE GLM
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
        readability_score: 'Excelente'
    };
    // FIM DO MOCK

    // --- PASSO 2: Geração do Prompt de Imagem ---
    const imagePromptRequest = `Com base no artigo que você escreveu sobre '${keyword}', crie um prompt extremamente detalhado em inglês para um gerador de imagens (como DALL-E 3). O prompt deve descrever a cena, o estilo (fotográfico, limpo), a iluminação e o ângulo. Adicione um 'negative prompt' para evitar texto, logotipos ou elementos borrados. Retorne apenas o prompt em inglês, sem formatação JSON ou explicações.`;
    
    // Simulação de chamada à GLM para gerar o prompt de imagem
    // const imagePromptResponse = await callGlmApi(imagePromptRequest, 'glm-4-text');
    
    // MOCK DE PROMPT DE IMAGEM
    const imagePromptResponse = `A high-quality, professional photograph of a successful Mozambican entrepreneur in Maputo, standing proudly next to a display of modern ${keyword} products. The scene is brightly lit with natural light, clean background, shallow depth of field. The entrepreneur is smiling and wearing business casual attire. Negative prompt: text, logos, blurry, low resolution, cartoon, watermark.`;
    // FIM DO MOCK

    // --- PASSO 3: Estruturação da Resposta Final ---
    const finalResponse = {
        ...articleData,
        image_prompt: imagePromptResponse,
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