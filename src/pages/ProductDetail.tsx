import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowLeft, ShoppingCart, Package, MessageCircle, CreditCard, Store } from 'lucide-react'
import { showSuccess, showError } from '../utils/toast'
import ChatWindow from '../components/ChatWindow'

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductWithSeller | null>(null)
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      fetchProduct(id)
    }
  }, [id])

  const fetchProduct = async (productId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey (
            id,
            store_name,
            email
          )
        `)
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } else {
        setProduct(data)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  const handleStartChat = () => {
    if (!user) {
      showError('Faça login para conversar com o vendedor')
      navigate('/login')
      return
    }
    
    if (!product || !product.seller_id) return
    
    if (user.id === product.seller_id) {
      showError('Você não pode conversar com você mesmo!')
      return
    }

    setIsChatOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Produto Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para produtos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canChat = user && user.id !== product.seller_id

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Imagem do Produto */}
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Informações do Produto */}
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h1>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl font-bold text-green-600">
                      {formatPrice(product.price)}
                    </div>
                    <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pagamento na entrega
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Package className="w-4 h-4 mr-2" />
                    {product.stock} unidades em estoque
                  </div>

                  <div className="flex-1 mb-6">
                    <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {product.description || 'Nenhuma descrição disponível.'}
                    </p>
                  </div>

                  {/* Card do Vendedor */}
                  {product.seller && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Vendido por</h3>
                      <Link to={`/loja/${product.seller.id}`}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Store className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-blue-600">
                                {product.seller.store_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {product.seller.email}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Link to={`/confirmar-encomenda/${product.id}`} className="w-full block">
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {product.stock === 0 ? 'Fora de Estoque' : 'Encomendar Agora'}
                      </Button>
                    </Link>

                    {canChat && (
                      <Button
                        onClick={handleStartChat}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Conversar com Vendedor
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Window Modal */}
      {product && (
        <ChatWindow
          productId={product.id}
          sellerId={product.seller_id}
          productName={product.name}
          sellerName={product.seller?.store_name}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </>
  )
}

export default ProductDetail