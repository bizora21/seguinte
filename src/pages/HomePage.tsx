import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { motion, Variants } from 'framer-motion'
import { 
  Store, 
  Package, 
  Shield, 
  Truck, 
  CreditCard,
  Zap,
  Users,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle,
  TrendingUp,
  Headphones,
  BarChart3,
  Search,
  ShoppingBag,
  MessageCircle,
  Gift,
  Star,
  Heart,
  Globe
} from 'lucide-react'

// Tipagem para as vantagens
interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

// Tipagem para os passos
interface Step {
  icon: React.ReactNode
  title: string
  description: string
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithSeller[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showProducts, setShowProducts] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeaturedProducts = async () => {
    if (showProducts) return // Evitar múltiplas requisições
    
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(id, store_name)
        `)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setFeaturedProducts(data || [])
      setShowProducts(true)
    } catch (err: any) {
      console.error('Error fetching featured products:', err)
      setError('Não foi possível carregar os produtos em destaque.')
    } finally {
      setLoading(false)
    }
  }

  // Animações
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12
      }
    }
  }

  // Dados de Conteúdo
  const features: Feature[] = [
    {
      icon: <Zap className="w-8 h-8 text-green-600" />,
      title: 'Entrega Rápida',
      description: 'Receba seus produtos em 5-10 dias úteis em todo Moçambique.'
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: 'Pagamento Seguro',
      description: 'Pague na entrega. Só pague quando receber seu produto.'
    },
    {
      icon: <MapPin className="w-8 h-8 text-purple-600" />,
      title: 'Conexão Local',
      description: 'Apoie vendedores moçambicanos e encontre produtos únicos.'
    }
  ]

  const clientSteps: Step[] = [
    {
      icon: <Search className="w-6 h-6 text-blue-600" />,
      title: 'Busque e Escolha',
      description: 'Encontre produtos de vendedores locais em todo o país.'
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-green-600" />,
      title: 'Faça seu Pedido',
      description: 'Selecione os produtos e confira seu carrinho.'
    },
    {
      icon: <Truck className="w-6 h-6 text-purple-600" />,
      title: 'Receba em Casa',
      description: 'Acompanhe sua entrega e pague na hora.'
    }
  ]

  const sellerSteps: Step[] = [
    {
      icon: <Package className="w-6 h-6 text-orange-600" />,
      title: 'Cadastre sua Loja',
      description: 'Crie sua conta e comece a vender em minutos.'
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      title: 'Gerencie Pedidos',
      description: 'Acompanhe suas vendas e organize seu estoque.'
    },
    {
      icon: <CreditCard className="w-6 h-6 text-green-600" />,
      title: 'Receba seu Dinheiro',
      description: 'Seus pagamentos são seguros e rápidos.'
    }
  ]

  const clientBenefits: Feature[] = [
    {
      icon: <Gift className="w-6 h-6 text-red-600" />,
      title: 'Variedade de Produtos',
      description: 'Encontre tudo o que precisa em um só lugar.'
    },
    {
      icon: <Star className="w-6 h-6 text-yellow-600" />,
      title: 'Qualidade Garantida',
      description: 'Todos os vendedores são verificados pela nossa equipe.'
    },
    {
      icon: <Headphones className="w-6 h-6 text-blue-600" />,
      title: 'Suporte 24/7',
      description: 'Tire suas dúvidas com nossa equipe especializada.'
    }
  ]

  const sellerBenefits: Feature[] = [
    {
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      title: 'Alcance Nacional',
      description: 'Venda para clientes em todo Moçambique.'
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: 'Plataforma Gratuita',
      description: 'Sem taxas de adesão ou mensalidade.'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
      title: 'Pagamentos Seguros',
      description: 'Receba seus pagamentos de forma rápida e segura.'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              O Maior Marketplace de
              <span className="block text-yellow-400">Moçambique</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Compre e venda com segurança. Conectamos vendedores locais com clientes em todo o país.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/lojas')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-4 text-lg"
              >
                <Store className="w-5 h-5 mr-2" />
                Explorar Lojas
              </Button>
              <Button 
                size="lg"
                onClick={() => navigate('/register')} 
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold px-8 py-4 text-lg border-0"
              >
                <Users className="w-5 h-5 mr-2" />
                Cadastrar como Vendedor
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Descubra os produtos mais populares da nossa plataforma
            </p>
            
            {!showProducts && (
              <Button
                onClick={fetchFeaturedProducts}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Package className="w-5 h-5 mr-2" />
                Veja os Produtos em Destaque
              </Button>
            )}

            {loading && (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            )}

            {error && (
              <div className="text-center text-red-600 p-8">
                {error}
              </div>
            )}

            {showProducts && featuredProducts.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
              >
                {featuredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {showProducts && featuredProducts.length === 0 && (
              <div className="text-center p-12 bg-gray-50 rounded-lg">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum produto em destaque no momento.</p>
              </div>
            )}

            {showProducts && (
              <div className="text-center">
                <Button
                  onClick={() => navigate('/produtos')}
                  size="lg"
                  variant="outline"
                >
                  Ver Catálogo Completo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Por que LojaRápida? */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Por que LojaRápida?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Somos a plataforma de e-commerce mais confiável de Moçambique, criada para conectar 
                vendedores locais com clientes de todo o país. Com foco em segurança e conveniência, 
                oferecemos uma experiência de compra e venda única.
              </p>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {feature.icon}
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop" 
                alt="LojaRápida Marketplace" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Como Funciona? */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como Funciona?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simples e rápido. Veja como comprar e vender na LojaRápida
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Para Clientes */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-2 text-blue-600" />
                Para Clientes
              </h3>
              <div className="space-y-6">
                {clientSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{step.title}</h4>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Para Vendedores */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Store className="w-6 h-6 mr-2 text-green-600" />
                Para Vendedores
              </h3>
              <div className="space-y-6">
                {sellerSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{step.title}</h4>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vantagens para Clientes */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1554224155-6726b4face38?w=800&h=600&fit=crop" 
                alt="Vantagens para Clientes" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Vantagens para Clientes
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Na LojaRápida, você encontra produtos de qualidade com total segurança e conveniência.
              </p>
              <div className="space-y-4">
                {clientBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {benefit.icon}
                    <div>
                      <h3 className="font-semibold text-lg">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vantagens para Vendedores */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Vantagens para Vendedores
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Junte-se à nossa rede de vendedores e alcance milhares de clientes em todo Moçambique.
              </p>
              <div className="space-y-4">
                {sellerBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {benefit.icon}
                    <div>
                      <h3 className="font-semibold text-lg">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1554224155-6726b4face38?w=800&h=600&fit=crop" 
                alt="Vantagens para Vendedores" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Junte-se a milhares de vendedores e clientes que já confiam na LojaRápida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/register')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-4 text-lg"
                size="lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Criar Conta Gratuita
              </Button>
              <Button
                onClick={() => navigate('/lojas')}
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold px-8 py-4 text-lg border-0"
                size="lg"
              >
                <Store className="w-5 h-5 mr-2" />
                Explorar Lojas
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage