import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Search, Plus } from 'lucide-react'

const Index = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bem-vindo à LojaRápida
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Descubra produtos incríveis dos melhores vendedores
            </p>
            
            {user ? (
              <div className="space-y-4">
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-lg">Olá, {user.email}!</CardTitle>
                    <CardDescription>
                      {user.profile?.role === 'vendedor' 
                        ? `Gerencie sua loja: ${user.profile.store_name || 'Sem nome'}`
                        : 'Descubra produtos incríveis'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Tipo de conta: <span className="capitalize">{user.profile?.role}</span>
                    </p>
                    {user.profile?.role === 'vendedor' && (
                      <Button onClick={() => navigate('/adicionar-produto')} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-x-4">
                <Button size="lg" onClick={() => navigate('/register')}>
                  Começar Agora
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                  Fazer Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Produtos</h2>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {productsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível ainda'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente buscar com outros termos'
                : 'Os vendedores ainda não adicionaram produtos. Volte em breve!'
              }
            </p>
            {user?.profile?.role === 'vendedor' && (
              <Button 
                onClick={() => navigate('/adicionar-produto')} 
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Index