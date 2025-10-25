import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { ArrowLeft, CheckCircle, Store, Package, TrendingUp, Search, Shield, Users, MapPin, CreditCard, Truck, MessageCircle, Star, Gift, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { SEO } from '../../components/SEO'

const ARTICLE_URL = "https://lojarapida.co.mz/blog/vender-online-mocambique"
const ARTICLE_IMAGE = "/blog/vender-online-mocambique.jpg"
const PUBLISH_DATE = "2024-08-15T10:00:00+02:00" // Data de publicação
const MODIFIED_DATE = new Date().toISOString() // Data de modificação

// --- JSON-LD Schema.org ---
const generateArticleSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Como Vender Online em Moçambique: O Guia Completo da LojaRápida",
    "description": "Descubra o guia completo para começar a vender online em Moçambique. Aprenda a usar o Pagamento na Entrega, otimizar seus produtos para SEO e alcançar clientes em Maputo, Matola e todo o país.",
    "image": {
      "@type": "ImageObject",
      "url": `https://lojarapida.co.mz${ARTICLE_IMAGE}`,
      "width": 1200,
      "height": 630,
      "caption": "Empreendedor moçambicano vendendo online com sucesso na LojaRápida."
    },
    "author": {
      "@type": "Organization",
      "name": "Equipe LojaRápida"
    },
    "publisher": {
      "@type": "Organization",
      "name": "LojaRápida Marketplace",
      "logo": {
        "@type": "ImageObject",
        "url": "https://lojarapida.co.mz/favicon.svg",
        "width": 40,
        "height": 40
      }
    },
    "datePublished": PUBLISH_DATE,
    "dateModified": MODIFIED_DATE,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": ARTICLE_URL
    },
    "isPartOf": [
      {
        "@type": "WebPage",
        "name": "LojaRápida",
        "description": "O maior marketplace de Moçambique.",
        "url": "https://lojarapida.co.mz/"
      }
    ]
  }
}

const VenderOnlineMocambique = () => {
  const navigate = useNavigate()
  const articleSchema = generateArticleSchema()

  return (
    <>
      <SEO
        title="Como Vender Online em Moçambique: O Guia Completo da LojaRápida"
        description="Descubra o guia completo para começar a vender online em Moçambique. Aprenda a usar o Pagamento na Entrega, otimizar seus produtos para SEO e alcançar clientes em Maputo, Matola e todo o país."
        image={ARTICLE_IMAGE}
        url={ARTICLE_URL}
        type="article"
        jsonLd={[articleSchema]}
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Blog
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-lg shadow-lg"
          >
            <article className="prose max-w-none">
              <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                  Como Vender Online em Moçambique: O Guia Completo da LojaRápida
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Seu passo a passo para dominar o **e-commerce em Moçambique**, desde o cadastro até a otimização de vendas.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Por: Equipe LojaRápida</span>
                  <span>•</span>
                  <span>Publicado em: 15 de Agosto de 2024</span>
                </div>
              </header>

              {/* Imagem de Destaque */}
              <figure className="mb-8">
                <img
                  src={ARTICLE_IMAGE}
                  alt="Empreendedor moçambicano sorrindo ao lado de caixas de produtos, simbolizando sucesso no e-commerce."
                  className="w-full h-auto rounded-lg shadow-md"
                />
                <figcaption className="text-center text-sm text-gray-500 mt-2">
                  A LojaRápida conecta você a milhares de clientes em Maputo, Matola, Beira e todo o país.
                </figcaption>
              </figure>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Store className="w-6 h-6 mr-2 text-green-600" />
                  1. Por Que Vender Online em Moçambique?
                </h2>
                <p>
                  O mercado de **vendas online em Moçambique** está em plena expansão. A LojaRápida oferece a infraestrutura necessária para que pequenos e médios empreendedores alcancem clientes em todas as províncias, superando barreiras logísticas e de confiança.
                </p>
                <p>
                  Nosso diferencial é o **Pagamento na Entrega (COD)**, que elimina a desconfiança do cliente e aumenta drasticamente suas taxas de conversão.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-blue-600" />
                  2. Como Funciona a LojaRápida para Vendedores
                </h2>
                <p>
                  Começar a **vender online** conosco é um processo simples e transparente:
                </p>
                <ol className="list-decimal list-inside space-y-3 pl-4">
                  <li>
                    <strong>Cadastro Rápido:</strong> Crie sua conta de vendedor em minutos. Você precisará apenas de um email e do nome da sua loja.
                  </li>
                  <li>
                    <strong>Adicione Seus Produtos:</strong> Use o Dashboard do Vendedor para listar seus produtos. Inclua fotos de alta qualidade e descrições detalhadas (veja a seção de SEO abaixo!).
                  </li>
                  <li>
                    <strong>Receba Pedidos:</strong> Clientes em todo o país fazem pedidos. Você recebe a notificação instantaneamente no seu painel.
                  </li>
                  <li>
                    <strong>Prepare e Envie:</strong> Prepare o produto para a recolha. Nossa equipa de logística cuida da entrega e da cobrança do **pagamento na entrega**.
                  </li>
                  <li>
                    <strong>Receba Seu Dinheiro:</strong> Após a confirmação da entrega e do pagamento pelo cliente, você recebe o valor da venda (menos a comissão) diretamente na sua conta.
                  </li>
                </ol>
              </section>

              <section className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Vantagem Chave: Pagamento na Entrega
                </h3>
                <p className="text-green-700">
                  O Pagamento na Entrega é crucial para o **marketplace em Maputo** e outras cidades. Ele constrói confiança, pois o cliente só paga após inspecionar o produto. Isso reduz o abandono de carrinho e aumenta suas vendas.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-purple-600" />
                  3. Dicas de Sucesso para Vendedores
                </h2>
                <ul className="list-disc list-inside space-y-3 pl-4">
                  <li>
                    <strong>Fotos Profissionais:</strong> Use o máximo de imagens permitido (até 2) e garanta que sejam claras e bem iluminadas.
                  </li>
                  <li>
                    <strong>Estoque Atualizado:</strong> Mantenha o estoque preciso para evitar cancelamentos e frustração do cliente.
                  </li>
                  <li>
                    <strong>Comunicação Rápida:</strong> Use o sistema de chat da LojaRápida para responder rapidamente às dúvidas dos clientes. A agilidade aumenta a probabilidade de venda.
                  </li>
                  <li>
                    <strong>Embalagem Segura:</strong> Invista em embalagens que protejam o produto durante o transporte em Moçambique.
                  </li>
                </ul>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Search className="w-6 h-6 mr-2 text-orange-600" />
                  4. SEO Avançado para Seus Produtos
                </h2>
                <p>
                  Para que seus produtos apareçam no topo das buscas (tanto na LojaRápida quanto no Google), você precisa de SEO (Search Engine Optimization).
                </p>
                
                <h3 className="text-xl font-semibold mt-4 mb-2">Otimização de Títulos e Descrições</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>
                    <strong>Palavra-chave Principal:</strong> Inclua a palavra-chave principal (ex: "Smartphone Samsung Maputo") no título do produto.
                  </li>
                  <li>
                    <strong>Descrição Detalhada:</strong> Use a descrição para responder a todas as perguntas do cliente. Inclua especificações técnicas, materiais e benefícios.
                  </li>
                  <li>
                    <strong>Variações de Busca:</strong> Se você vende um "Tênis Esportivo", use termos relacionados na descrição, como "calçado de corrida" ou "sapatilha para treino".
                  </li>
                </ul>
                
                <h3 className="text-xl font-semibold mt-4 mb-2">Foco na Conversão</h3>
                <p>
                  O SEO não é só sobre tráfego, é sobre vendas. Certifique-se de que seu preço é competitivo e que a descrição do produto inspira confiança.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-red-600" />
                  5. Alcance Nacional e Logística
                </h2>
                <p>
                  Com a LojaRápida, você não está limitado a vender apenas na sua cidade. Nossa plataforma permite que você alcance clientes em todo Moçambique, desde Maputo até Nampula, passando por Beira e Quelimane.
                </p>
                <p>
                  Nossa rede de logística é robusta e confiável, garantindo que seus produtos cheguem aos clientes em perfeitas condições e dentro do prazo. Além disso, o **pagamento na entrega** é gerenciado por nós, eliminando o risco de não pagamento.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                  6. Comunicação Direta com o Cliente
                </h2>
                <p>
                  A comunicação é a chave para o sucesso no e-commerce. Na LojaRápida, oferecemos um sistema de chat integrado que permite que você converse diretamente com seus clientes antes, durante e após a venda.
                </p>
                <p>
                  Use o chat para esclarecer dúvidas, fornecer informações adicionais sobre o produto e construir um relacionamento de confiança com o cliente. Uma boa comunicação pode ser o diferencial que leva o cliente a escolher sua loja em vez da concorrência.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="w-6 h-6 mr-2 text-yellow-500" />
                  7. Avaliações e Reputação
                </h2>
                <p>
                  As avaliações dos clientes são extremamente importantes para o sucesso da sua loja online. Produtos e vendedores com boas avaliações tendem a ter mais visibilidade e vendas.
                </p>
                <p>
                  Incentive seus clientes a deixarem avaliações após a compra. Responda às avaliações, tanto as positivas quanto as negativas, de forma profissional e construtiva. Isso mostra que você se importa com a opinião dos seus clientes e está disposto a melhorar.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Gift className="w-6 h-6 mr-2 text-purple-600" />
                  8. Promoções e Ofertas Especiais
                </h2>
                <p>
                  Promoções e ofertas especiais são uma ótima maneira de atrair novos clientes e fidelizar os existentes. Na LojaRápida, você pode criar promoções para produtos específicos ou para toda a sua loja.
                </p>
                <p>
                  Anuncie suas promoções nas redes sociais e no seu chat com os clientes. Ofereça descontos progressivos, frete grátis ou brindes para compras acima de um determinado valor. As promoções podem aumentar significativamente suas vendas em curtos períodos.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-green-600" />
                  9. Expansão e Crescimento
                </h2>
                <p>
                  À medida que suas vendas aumentam, você pode pensar em expandir seus negócios. Com a LojaRápida, você pode facilmente adicionar mais produtos, diversificar seu catálogo e até mesmo contratar ajuda para gerenciar suas vendas.
                </p>
                <p>
                  Nossa plataforma é escalável e cresce junto com você. Oferecemos ferramentas de análise de vendas para que você possa identificar seus produtos mais vendidos, seus melhores clientes e as regiões com maior demanda. Use esses dados para tomar decisões estratégicas e expandir seus negócios de forma inteligente.
                </p>
              </section>

              <footer className="mt-12 border-t pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Pronto para Começar a Vender?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Junte-se à plataforma que está transformando o **e-commerce em Moçambique**.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => navigate('/register')}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Store className="w-5 h-5 mr-2" />
                    Cadastrar Minha Loja Agora
                  </Button>
                  <Button
                    onClick={() => navigate('/politica-vendedor')}
                    variant="outline"
                    size="lg"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    Ver Política do Vendedor
                  </Button>
                </div>
                
                <div className="mt-8 text-sm text-gray-500 space-y-1">
                  <p>
                    <Link to="/termos" className="text-blue-600 hover:underline">
                      Leia nossos Termos de Uso
                    </Link>
                  </p>
                  <p>
                    <Link to="/faq" className="text-blue-600 hover:underline">
                      Perguntas Frequentes (FAQ)
                    </Link>
                  </p>
                </div>
              </footer>
            </article>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default VenderOnlineMocambique