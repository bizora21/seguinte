import React, { useState, useEffect } from 'react'
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
  DollarSign,
  MessageCircle,
  TrendingUp,
  User
} from 'lucide-react'
import { showSuccess, showError } from '../utils/toast'

// Tipagem para as estatísticas (mockadas ou reais)
interface Stat {
  number: string
  label: string
}

// Tipagem para as vantagens
interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithSeller[]>([])
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false)
  const [productsLoaded, setProductsLoaded] = useState<boolean>(false)

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

  // Lógica de carregamento de produtos sob demanda
  const fetchFeaturedProducts = async () => {
    if (productsLoaded) return // Evita recarregar

    setLoadingProducts(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(id, store_name)
        `)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(3) // Limite estrito de 3 produtos

      if (error) throw error
      setFeaturedProducts(data || [])
      setProductsLoaded(true)
      showSuccess('Produtos em destaque carregados!')
    } catch (err: any) {
      console.error('Error fetching featured products:', err)
      showError('Não foi possível carregar os produtos em destaque.')
    } finally {
      setLoadingProducts(false)
    }
  }

  // Dados de Conteúdo
  const features: Feature[] = [
    {
      icon: <Zap className="w-8 h-8 text-green-600" />,
      title: 'Velocidade',
      description: 'Entrega rápida em 5-10 dias úteis em todo Moçambique.'
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: 'Segurança Total',
      description: 'Pagamento na Entrega (COD). Pague só quando receber o produto.'
    },
    {
      icon: <MapPin className="w-8 h-8 text-purple-600" />,
      title: 'Conexão Local',
      description: 'Apoie vendedores moçambicanos e encontre produtos únicos.'
    }
  ]

  const stats: Stat[] = [
    { number: '10K+', label: 'Clientes Satisfeitos' },
    { number: '50+', label: 'Lojas Verificadas' },
    { number: '1000+', label: 'Produtos Nacionais' },
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
                onClick={() => navigate('/produtos')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-4 text-lg"
              >
                <Package className="w-5 h-5 mr-2" />
                Explorar Produtos
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

      {/* Por que LojaRápida? (Cutout 1) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Por que escolher a LojaRápida?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Somos o marketplace de Moçambique focado em segurança e confiança. Nossa plataforma foi construída para garantir que você tenha a melhor experiência de compra e venda.
              </p>
              <ul className="space-y-3 text-lg text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <span>Pagamento na Entrega: Zero risco para o cliente.</span>
                </li>
                <li className="flex items-start">
                  <Truck className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <span>Frete Grátis: Entregamos em todas as províncias.</span>
                </li>
                <li className="flex items-start">
                  <Store className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <span>Apoio Local: Fortalecendo o comércio moçambicano.</span>
                </li>
              </ul>
              <Link to="/sobre-nos">
                <Button variant="link" className="mt-6 px-0 text-green-600 hover:text-green-700">
                  Saiba Mais Sobre Nós <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop" 
                alt="Marketplace Moçambique" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Como Funciona? (Cutout 2 - Invertido) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <img 
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=400&fit=crop" 
                alt="Processo de Compra" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Como Funciona? Simples e Rápido
              </h2>
              <div className="space-y-6">
                {/* Passo 1: Cliente */}
                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Para Clientes</h3>
                    <p className="text-gray-600">1. Encontre o produto. 2. Faça a encomenda. 3. Pague na entrega.</p>
                  </div>
                </div>
                {/* Passo 2: Vendedor */}
                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Para Vendedores</h3>
                    <p className="text-gray-600">1. Cadastre sua loja. 2. Adicione produtos. 3. Receba pedidos e envie.</p>
                  </div>
                </div>
              </div>
              <Link to="/faq">
                <Button variant="link" className="mt-6 px-0 text-green-600 hover:text-green-700">
                  Ver Perguntas Frequentes <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Produtos em Destaque (On-Demand) */}
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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Veja uma amostra dos melhores produtos disponíveis hoje.
            </p>
          </motion.div>

          {!productsLoaded ? (
            <div className="text-center">
              <Button
                onClick={fetchFeaturedProducts}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                disabled={loadingProducts}
              >
                {loadingProducts ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Carregando Destaques...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 mr-2" />
                    Veja os Produtos em Destaque
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {featuredProducts.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
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
              ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum produto em destaque no momento.</p>
                </div>
              )}
              
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
            </>
          )}
        </div>
      </section>

      {/* Vantagens para Clientes (Cutout 3) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Vantagens para Clientes
              </h2>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <Shield className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Zero Risco</h3>
                    <p className="text-gray-600 text-base">Pague somente após receber e verificar o produto.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <MessageCircle className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Comunicação Direta</h3>
                    <p className="text-gray-600 text-base">Converse com o vendedor antes de finalizar a compra.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Truck className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Entrega Rápida</h3>
                    <p className="text-gray-600 text-base">Logística eficiente para todo o território moçambicano.</p>
                  </div>
                </li>
              </ul>
              <Button 
                onClick={() => navigate('/lojas')}
                className="mt-8 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Store className="w-5 h-5 mr-2" />
                Encontre sua Loja Favorita
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop" 
                alt="Vantagens para Clientes" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vantagens para Vendedores (Cutout 4 - Invertido) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <img 
                src="https://images.unsplash.com/photo-1556745745-e40110300f2d?w=600&h=400&fit=crop" 
                alt="Vantagens para Vendedores" 
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Vantagens para Vendedores
              </h2>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <TrendingUp className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Aumento de Vendas</h3>
                    <p className="text-gray-600 text-base">Alcance clientes em todas as províncias de Moçambique.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <DollarSign className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Comissões Claras</h3>
                    <p className="text-gray-600 text-base">Estrutura de comissão justa e transparente.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Gestão Simplificada</h3>
                    <p className="text-gray-600 text-base">Dashboard completo para gerenciar produtos e pedidos.</p>
                  </div>
                </li>
              </ul>
              <Button
                onClick={() => navigate('/register')}
                className="mt-8 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Store className="w-5 h-5 mr-2" />
                Cadastre sua Loja Agora
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comece a Comprar ou Vender Hoje!
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              A LojaRápida é a sua porta de entrada para o e-commerce em Moçambique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/produtos')}
                className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-8 py-4 text-lg"
                size="lg"
              >
                <Package className="w-5 h-5 mr-2" />
                Ver Produtos
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="bg-white hover:bg-gray-100 text-blue-700 font-semibold px-8 py-4 text-lg border-0"
                size="lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Criar Conta
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage