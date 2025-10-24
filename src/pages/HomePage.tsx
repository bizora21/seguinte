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
  Loader2
} from 'lucide-react'

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
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      // Busca robusta: 3 produtos mais recentes com estoque > 0
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

      {/* Features/Vantagens Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.5 }}
                className="p-6 border rounded-lg shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us / Stats Section */}
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
                Sobre a LojaRápida
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Nascemos em Moçambique para revolucionar o e-commerce local. Nossa missão é simples: 
                oferecer uma plataforma segura, rápida e confiável, conectando o melhor do comércio local 
                diretamente aos consumidores, com a tranquilidade do pagamento na entrega.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-white rounded-lg shadow-md">
                    <div className="text-2xl font-bold text-green-600 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
              <Link to="/sobre-nos">
                <Button variant="link" className="mt-4 px-0 text-green-600 hover:text-green-700">
                  Leia nossa história <ArrowRight className="w-4 h-4 ml-1" />
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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Os melhores produtos selecionados para você
            </p>
          </motion.div>

          {loading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-600 p-8">{error}</div>
          )}

          {!loading && !error && featuredProducts.length > 0 && (
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
          
          {!loading && featuredProducts.length === 0 && !error && (
            <div className="text-center p-12 bg-gray-50 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum produto em destaque no momento.</p>
            </div>
          )}

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
        </div>
      </section>

      {/* CTA for Sellers Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Venda Mais em Moçambique
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Junte-se à nossa rede de vendedores e alcance milhares de clientes em todo o país.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/register')}
                className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-8 py-4 text-lg"
                size="lg"
              >
                <Store className="w-5 h-5 mr-2" />
                Começar a Vender Agora
              </Button>
              <Link to="/politica-vendedor">
                <Button
                  variant="outline"
                  className="bg-white hover:bg-gray-100 text-blue-700 font-semibold px-8 py-4 text-lg border-0"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Política do Vendedor
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage