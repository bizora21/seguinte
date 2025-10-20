import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types/product'
import AnimatedProductCard from '../components/AnimatedProductCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Search, Plus, Star, TrendingUp, Users, ShoppingBag } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import SearchBar from '../components/SearchBar'

const Index = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8) // Mostrar apenas os 8 mais recentes na home

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setProductsLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6">
              Bem-vindo à LojaRápida
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Descubra produtos incríveis dos melhores vendedores do Brasil
            </p>
            
            {/* Barra de Busca Principal */}
            <div className="mb-8">
              <SearchBar />
            </div>
            
            {user ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <Card className="max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Olá, {user.email}!</CardTitle>
                    <CardDescription className="text-blue-100">
                      {user.profile?.role === 'vendedor' 
                        ? `Gerencie sua loja: ${user.profile.store_name || 'Sem nome'}`
                        : 'Descubra produtos incríveis'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-100 mb-4">
                      Tipo de conta: <span className="capitalize">{user.profile?.role}</span>
                    </p>
                    {user.profile?.role === 'vendedor' && (
                      <Button onClick={() => navigate('/adicionar-produto')} className="w-full bg-white text-blue-600 hover:bg-gray-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-x-4"
              >
                <Button size="lg" onClick={() => navigate('/register')} className="bg-white text-blue-600 hover:bg-gray-100">
                  Começar Agora
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/login')} className="border-white text-white hover:bg-white/20">
                  Fazer Login
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { icon: <Users className="w-8 h-8 text-blue-600" />, value: '10K+', label: 'Vendedores' },
              { icon: <ShoppingBag className="w-8 h-8 text-green-600" />, value: '50K+', label: 'Produtos' },
              { icon: <Star className="w-8 h-8 text-yellow-500" />, value: '4.8', label: 'Avaliação' },
              { icon: <TrendingUp className="w-8 h-8 text-purple-600" />, value: '100K+', label: 'Clientes' }
            ].map((stat, index) => (
              <motion.div key={index} variants={itemVariants}>
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Products Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Produtos em Destaque</h2>
            <p className="text-xl text-gray-600">
              Confira os produtos mais recentes adicionados à nossa plataforma
            </p>
          </motion.div>

          {productsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando produtos...</p>
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum produto disponível ainda
                </h3>
                <p className="text-gray-600 mb-6">
                  Os vendedores ainda não adicionaram produtos. Volte em breve!
                </p>
                {user?.profile?.role === 'vendedor' && (
                  <Button onClick={() => navigate('/adicionar-produto')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Produto
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <AnimatedProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate('/busca')}
              size="lg"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Search className="w-4 h-4 mr-2" />
              Ver Todos os Produtos
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Index