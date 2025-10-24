import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Button } from '../components/ui/button'
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
  Search,
  ShoppingBag,
  TruckIcon,
  CreditCardIcon,
  MessageCircle,
  Star,
  Heart,
  Gift,
  Globe
} from 'lucide-react'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithSeller[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showProducts, setShowProducts] = useState<boolean>(false)

  const fetchFeaturedProducts = async () => {
    setLoading(true)
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
    } catch (err: any) {
      console.error('Error fetching featured products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShowProducts = () => {
    if (!showProducts) {
      fetchFeaturedProducts()
    }
    setShowProducts(true)
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

  // Seção de benefícios
  const benefits = [
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: 'Compra 100% Segura',
      description: 'Pagamento na entrega. Você só paga quando receber o produto.'
    },
    {
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: 'Entrega Grátis',
      description: 'Frete grátis para todo Moçambique. Entrega em 5-10 dias úteis.'
    },
    {
      icon: <Store className="w-8 h-8 text-purple-600" />,
      title: 'Apoie Vendedores Locais',
      description: 'Conectamos você com os melhores vendedores de todo o país.'
    },
    {
      icon: <CreditCard className="w-8 h-8 text-orange-600" />,
      title: 'Pagamento Flexível',
      description: 'Aceitamos M-Pesa, eMola, dinheiro e cartão na entrega.'
    }
  ]

  // Passos de como funciona
  const steps = [
    {
      icon: <Search className="w-6 h-6 text-green-600" />,
      title: 'Busque e Escolha',
      description: 'Navegue por milhares de produtos de vendedores locais.'
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
      title: 'Faça seu Pedido',
      description: 'Selecione os produtos e confira seu carrinho.'
    },
    {
      icon: <TruckIcon className="w-6 h-6 text-purple-600" />,
      title: 'Receba em Casa',
      description: 'Aguarde a entrega e pague na hora.'
    },
    {
      icon: <CreditCardIcon className="w-6 h-6 text-orange-600" />,
      title: 'Avalie sua Experiência',
      description: 'Compartilhe sua experiência e ajude outros clientes.'
    }
  ]

  // Vantagens para clientes
  const clientBenefits = [
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: 'Segurança Garantida',
      description: 'Pague apenas quando receber o produto.'
    },
    {
      icon: <Truck className="w-5 h-5 text-blue-600" />,
      title: 'Entrega Rápida',
      description: 'Receba seus produtos em 5-10 dias úteis.'
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-purple-600" />,
      title: 'Suporte Direto',
      description: 'Converse diretamente com os vendedores.'
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      title: 'Produtos Verificados',
      description: 'Qualidade garantida por vendedores confiáveis.'
    }
  ]

  // Vantagens para vendedores
  const sellerBenefits = [
    {
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      title: 'Alcance Nacional',
      description: 'Venda para clientes em todo Moçambique.'
    },
    {
      icon: <Headphones className="w-5 h-5 text-blue-600" />,
      title: 'Suporte Especializado',
      description: 'Ajuda dedicada para crescer seu negócio.'
    },
    {
      icon: <CreditCard className="w-5 h-5 text-purple-600" />,
      title: 'Pagamento Seguro',
      description: 'Receba seus pagamentos de forma segura.'
    },
    {
      icon: <Users className="w-5 h-5 text-orange-600" />,
      title: 'Plataforma Gratuita',
      description: 'Comece a vender sem custos iniciais.'
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

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 border rounded-lg shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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
                Como Funciona?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Na LojaRápida, comprar e vender é simples, rápido e seguro. Siga estes passos:
              </p>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
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
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop" 
                alt="Como funciona a LojaRápida" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
          </div>
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
                onClick={handleShowProducts}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Package className="w-5 h-5 mr-2" />
                Veja os Produtos em Destaque
              </Button>
            )}
          </motion.div>

          {showProducts && (
            <>
              {loading && (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              )}

              {!loading && featuredProducts.length > 0 && (
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

              {!loading && featuredProducts.length === 0 && (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum produto em destaque no momento.</p>
                </div>
              )}
            </>
          )}

          {showProducts && (
            <div className="text-center">
              <Button
                onClick={() => navigate('/produtos')}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Ver Catálogo Completo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Client Benefits Section */}
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
                src="https://images.unsplash.com/photo-1554224155-6726b3f81c4c?w=600&h=400&fit=crop" 
                alt="Vantagens para clientes" 
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
                Na LojaRápida, você compra com segurança e conforto. Descubra as vantagens:
              </p>
              <div className="space-y-4">
                {clientBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seller Benefits Section */}
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
                Junte-se à nossa plataforma e cresça seu negócio. Oferecemos:
              </p>
              <div className="space-y-4">
                {sellerBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{benefit.title}</h3>
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
                src="https://images.unsplash.com/photo-1554224155-6726b3f81c4c?w=600&h=400&fit=crop" 
                alt="Vantagens para vendedores" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
                onClick={() => navigate('/produtos')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-4 text-lg"
                size="lg"
              >
                <Package className="w-5 h-5 mr-2" />
                Explorar Produtos Agora
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold px-8 py-4 text-lg border-0"
                size="lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Criar Conta Gratuita
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage