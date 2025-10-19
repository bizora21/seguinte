import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types/product'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react'
import { showSuccess } from '../utils/toast'

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProduct(id)
    }
  }, [id])

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleAddToCart = () => {
    if (product) {
      showSuccess(`${product.name} adicionado ao carrinho!`)
      console.log('Produto adicionado ao carrinho:', product)
    }
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
            <Link to="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para produtos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para produtos
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Imagem do Produto */}
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop'
                    }}
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop"
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Informações do Produto */}
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <div className="text-3xl font-bold text-green-600 mb-4">
                  {formatPrice(product.price)}
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Package className="w-4 h-4 mr-2" />
                  {product.stock} unidades em estoque
                </div>

                <div className="flex-1 mb-6">
                  <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {product.description || 'Nenhuma descrição disponível para este produto.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleAddToCart}
                    className="w-full"
                    size="lg"
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {product.stock === 0 ? 'Fora de Estoque' : 'Adicionar ao Carrinho'}
                  </Button>

                  {product.stock <= 5 && product.stock > 0 && (
                    <p className="text-sm text-orange-600 text-center">
                      ⚠️ Apenas {product.stock} unidades disponíveis!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProductDetail