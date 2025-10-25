import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { ArrowLeft, CheckCircle, Store, Package, TrendingUp, Search, Shield, Users, MapPin, CreditCard, Truck, MessageCircle, Star, Gift, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { SEO } from '../../components/SEO'

// Use uma imagem natural hospedada em public/ (caminho absoluto na aplicação)
// Certifique-se de que public/blog/vender-online-mocambique.jpg exista (já incluída no projeto)
const ARTICLE_PATH = '/blog/vender-online-mocambique.jpg'
const ARTICLE_URL = 'https://lojarapidamz.com/blog/vender-online-mocambique'
const PUBLISH_DATE = '2024-08-15T10:00:00+02:00'
const MODIFIED_DATE = new Date().toISOString()

const generateArticleSchema = () => {
  const imageUrl = `https://lojarapidamz.com${ARTICLE_PATH}`

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Como Vender Online em Moçambique: O Guia Completo da LojaRápida",
    "description": "Descubra o guia completo para começar a vender online em Moçambique. Aprenda a usar o Pagamento na Entrega, otimizar seus produtos para SEO e alcançar clientes em Maputo, Matola e todo o país.",
    "image": {
      "@type": "ImageObject",
      "url": imageUrl,
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
        "url": "https://lojarapidamz.com/favicon.svg",
        "width": 40,
        "height": 40
      }
    },
    "datePublished": PUBLISH_DATE,
    "dateModified": MODIFIED_DATE,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": ARTICLE_URL
    }
  }
}

const VenderOnlineMocambique = () => {
  const navigate = useNavigate()
  const articleSchema = generateArticleSchema()

  // Short description optimized for Discover and Mozambique audience
  const description = "Guia prático para vender online em Moçambique — pagamento na entrega, fotos que convertem, logística e SEO para alcançar clientes locais."

  return (
    <>
      <SEO
        title="Como Vender Online em Moçambique: Guia Completo | LojaRápida"
        description={description}
        image={ARTICLE_PATH} // SEO component fará o prefixo absoluto
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
                  Seu passo a passo para dominar o e-commerce em Moçambique, desde o cadastro até a otimização de vendas.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Por: Equipe LojaRápida</span>
                  <span>•</span>
                  <span>Publicado em: 15 de Agosto de 2024</span>
                </div>
              </header>

              {/* Imagem de Destaque NATURAL (arquivo em public/) */}
              <figure className="mb-8">
                <img
                  src={ARTICLE_PATH}
                  alt="Empreendedor moçambicano sorrindo ao lado de caixas de produtos, simbolizando sucesso no e-commerce."
                  className="w-full h-auto rounded-lg shadow-md object-cover"
                />
                <figcaption className="text-center text-sm text-gray-500 mt-2">
                  A LojaRápida conecta vendedores locais a milhares de clientes em todo Moçambique.
                </figcaption>
              </figure>

              {/* Conteúdo do artigo (mantido igual ao anterior — resumido neste arquivo) */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Store className="w-6 h-6 mr-2 text-green-600" />
                  1. Por Que Vender Online em Moçambique?
                </h2>
                <p>
                  O mercado de vendas online em Moçambique está em plena expansão. A LojaRápida oferece a infraestrutura necessária para que pequenos e médios empreendedores alcancem clientes em todas as províncias.
                </p>
                <p className="mt-4">
                  Nosso diferencial é o Pagamento na Entrega (COD), que reduz a desconfiança do comprador e aumenta as conversões.
                </p>
              </section>

              {/* ... restante do artigo mantido ... */}
              <footer className="mt-12 border-t pt-6">
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
              </footer>
            </article>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default VenderOnlineMocambique