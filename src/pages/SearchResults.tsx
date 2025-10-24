import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Search, Filter, ArrowLeft } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import SearchBar from '../components/SearchBar'
import CategoryFilter from '../components/CategoryFilter'

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalResults, setTotalResults] = useState(0)

  const query = searchParams.get('q') || ''
  const category = searchParams.get('categoria') || 'todos'
  const maxPrice = searchParams.get('preco-max') || ''

  useEffect(() => {
    fetchProducts()
  }, [searchParams])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let supabaseQuery = supabase
        .from('products')
        .select(`
          *,
          category:categories (
            name,
            slug
          ),
          seller:profiles!products_seller_id_fkey(id, store_name)
        `)

      // Aplicar filtros
      if (query) {
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${query}%,description.ilike.%${query}%`
        )
      }

      if (category !== 'todos') {
        supabaseQuery = supabaseQuery.eq('categories.slug', category)
      }

      if (maxPrice) {
        supabaseQuery = supabaseQuery.lte('price', parseFloat(maxPrice))
      }

      const { data, error } = await supabaseQuery.order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching products:', error)
      } else {
        setProducts(data || [])
        setTotalResults(data?.length || 0)
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Resultados da Busca
            </h1>
            
            {query && (
              <p className="text-lg text-gray-600 mb-4">
                Buscando por: <span className="font-semibold text-green-600">&quot;{query}&quot;</span>
              </p>
            )}
            
            <div className="flex justify-center mb-8">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* Filtro de Categorias */}
        <div className="mb-8">
          <CategoryFilter selectedCategory={category} />
        </div>

        {/* Filtros Ativos */}
        {(query || category !== 'todos' || maxPrice) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtros Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {query && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Busca: {query}
                  </span>
                )}
                {category !== 'todos' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Categoria: {category}
                  </span>
                )}
                {maxPrice && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    Preço Máximo: {formatPrice(parseFloat(maxPrice))}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum produto encontrado
              </h2>
              <p className="text-gray-600">
                Tente ajustar os filtros ou usar termos diferentes na busca.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div>
            <p className="text-gray-600 mb-6">
              {totalResults} produto{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
            </p>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults