import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Product } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Search, Filter, Grid, List, Store, Package } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CategoryFilter from '../components/CategoryFilter'
import { useSearchParams } from 'react-router-dom'

interface ProductWithSeller extends Product {
  seller?: {
    id: string
    store_name: string
    email: string
  }
}

const ProductsPage = () => {
  const [products, setProducts] = useState<ProductWithSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // 🔥 QUERY CORRIGIDA: Usar sintaxe correta para buscar dados do vendedor
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!fk_products_seller_id (
            id,
            store_name,
            email
          )
        `)
        .gt('stock', 0)  // Apenas produtos com estoque
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar lógica de busca
    navigate(`/busca?q=${encodeURIComponent(searchQuery)}`)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-4">
              Explore Produtos Incríveis
            </h1>
            <p className="text-xl mb-8 text-green-100">
              Descubra os melhores produtos de vendedores locais em todo Moçambique
            </p>
            
            {/* Barra de Busca Principal */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar produtos, lojas ou categorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-lg h-12 bg-white text-gray-900 placeholder-gray-500"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700"
                >
                  Buscar
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Ordenação */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Todos os Produtos
              </h2>
              <p className="text-gray-600 mt-1">
                {products.length} produtos disponíveis de vendedores verificados
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filtro de Categorias */}
          <CategoryFilter />
        </div>

        {/* Grid de Produtos */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum produto encontrado
              </h2>
              <p className="text-gray-600">
                Volte em breve para novos produtos incríveis!
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className={viewMode === 'list' ? 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow' : ''}
              >
                {viewMode === 'grid' ? (
                  <ProductCard product={product} />
                ) : (
                  /* Visualização em Lista */
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop'
                            }}
                          />
                        ) : (
                          <img
                            src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop"
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {product.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className="text-xl font-bold text-green-600">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Estoque: {product.stock}
                          </span>
                          {product.seller?.store_name && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Store className="w-3 h-3 mr-1" />
                              {product.seller.store_name}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Button
                          onClick={() => navigate(`/produto/${product.id}`)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ProductsPage