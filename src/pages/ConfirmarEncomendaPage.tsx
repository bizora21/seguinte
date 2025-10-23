import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ArrowLeft, Package, User, MapPin, Phone, CreditCard, Truck, Shield } from 'lucide-react'
import { showSuccess, showError } from '../utils/toast'
import LoadingSpinner from '../components/LoadingSpinner'

interface OrderFormData {
  fullName: string
  deliveryAddress: string
  phone: string
}

const ConfirmarEncomendaPage = () => {
  const { productId } = useParams<{ productId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState<ProductWithSeller | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<OrderFormData>({
    fullName: '',
    deliveryAddress: '',
    phone: ''
  })

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  useEffect(() => {
    // Pré-preencher dados se usuário estiver logado
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.profile?.store_name || user.email.split('@')[0] || ''
      }))
    }
  }, [user])

  const fetchProduct = async () => {
    if (!productId) return

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
        showError('Produto não encontrado')
        navigate('/produtos')
        return
      }

      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      showError('Erro ao carregar produto')
      navigate('/produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      showError('Por favor, informe seu nome completo')
      return false
    }
    if (!formData.deliveryAddress.trim()) {
      showError('Por favor, informe o endereço de entrega')
      return false
    }
    if (!formData.phone.trim()) {
      showError('Por favor, informe seu contacto')
      return false
    }
    if (formData.phone.length < 8) {
      showError('Por favor, informe um contacto válido')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!user) {
      showError('Você precisa estar logado para fazer uma encomenda')
      navigate('/login')
      return
    }

    if (!product) {
      showError('Produto não encontrado')
      return
    }

    setSubmitting(true)

    try {
      // 1. Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: product.price,
          delivery_address: formData.deliveryAddress,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) {
        throw new Error('Erro ao criar pedido: ' + orderError.message)
      }

      // 🔥 MUDANÇA CRUCIAL: Buscar o seller_id do produto
      console.log('🔍 Buscando seller_id do produto:', productId)
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('seller_id')
        .eq('id', productId)
        .single()

      if (productError) {
        console.error('❌ Erro ao buscar seller_id:', productError)
        throw new Error('Erro ao obter informações do vendedor: ' + productError.message)
      }

      if (!productData?.seller_id) {
        throw new Error('Produto não possui vendedor associado')
      }

      console.log('✅ Seller_id encontrado:', productData.seller_id)

      // 2. Criar o item do pedido COM o seller_id
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: 1,
          price: product.price,
          user_id: user.id,
          seller_id: productData.seller_id // <-- 🔥 A MUDANÇA CRUCIAL AQUI
        })

      if (itemError) {
        console.error('❌ Erro ao criar item do pedido:', itemError)
        throw new Error('Erro ao adicionar item ao pedido: ' + itemError.message)
      }

      console.log('✅ Pedido e item criados com sucesso!')
      console.log('📦 Order ID:', order.id)
      console.log('👤 Seller ID:', productData.seller_id)
      console.log('🛒 Product ID:', product.id)

      showSuccess('Encomenda confirmada com sucesso!')
      navigate('/encomenda-sucesso')

    } catch (error: any) {
      console.error('❌ Error creating order:', error)
      showError(error.message || 'Erro ao processar sua encomenda')
    } finally {
      setSubmitting(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Produto Não Encontrado
            </h2>
            <Button onClick={() => navigate('/produtos')} className="w-full">
              Voltar para Produtos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Confirmar Encomenda</h1>
          <p className="text-gray-600 mt-2">
            Preencha seus dados para finalizar a encomenda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Seus Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Nome Completo *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome completo"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Contacto (Telefone/WhatsApp) *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+258 XX XXX XXXX"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryAddress" className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Endereço de Entrega *
                    </Label>
                    <Input
                      id="deliveryAddress"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      required
                      placeholder="Rua, número, bairro, cidade, província"
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? 'Processando...' : 'Confirmar Encomenda'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumo da Encomenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Produto */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop'
                        }}
                      />
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop"
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-gray-600">Quantidade: 1</p>
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>

                {/* Informações de Entrega */}
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    <span>Entrega em 5-10 dias úteis</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span>Pagamento na entrega</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Compra 100% segura</span>
                  </div>
                </div>

                {/* Vendedor */}
                {product.seller && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600 mb-1">Vendido por:</p>
                    <p className="font-medium text-sm">
                      {product.seller.store_name || product.seller.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmarEncomendaPage