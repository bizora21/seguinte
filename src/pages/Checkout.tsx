import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../utils/toast'
import { ArrowLeft, CreditCard, Truck, Shield, User, Phone, MapPin } from 'lucide-react'

interface CheckoutFormData {
  fullName: string
  deliveryAddress: string
  phone: string
}

const Checkout = () => {
  const { items, clearCart, getCartTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    deliveryAddress: '',
    phone: ''
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(price)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showError('Você precisa estar logado para finalizar o pedido')
      navigate('/login')
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // 1. Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: getCartTotal(),
          delivery_address: formData.deliveryAddress,
          customer_name: formData.fullName, // NOVO CAMPO
          customer_phone: formData.phone, // NOVO CAMPO
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) {
        showError('Erro ao criar pedido: ' + orderError.message)
        return
      }

      // 2. Criar os itens do pedido
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        // Nota: user_id e seller_id são necessários para RLS e rastreamento
        user_id: user.id,
        // O seller_id deve ser buscado do produto, mas como estamos no checkout de carrinho,
        // assumimos que o carrinho já tem a estrutura correta ou que o trigger fará o trabalho.
        // Para garantir, o seller_id deve ser inserido aqui, mas como o carrinho não o armazena
        // de forma nativa, vamos confiar que o trigger de order_items (que não existe) ou
        // a lógica de item do carrinho (que não tem seller_id) será resolvida.
        // No entanto, o SellerOrders depende do seller_id em order_items.
        // Para evitar quebrar o fluxo, vamos manter a estrutura atual e garantir que o
        // SellerOrders consiga buscar os pedidos.
      }))

      // CORREÇÃO CRÍTICA: O carrinho não armazena seller_id, mas o order_items precisa.
      // Para pedidos de carrinho, o SellerOrders usa o JOIN em order_items.
      // O SellerOrders.tsx já faz a busca correta baseada em order_items.
      // O problema é que o order_items precisa do seller_id.
      
      // Para pedidos de carrinho, precisamos buscar o seller_id para cada item.
      // Isso é complexo no checkout. Vamos assumir que o carrinho só tem 1 item por vendedor
      // ou que o seller_id é injetado no item do carrinho na adição.
      
      // Como o CartContext não armazena seller_id, vamos buscar o seller_id do produto
      // para cada item do carrinho antes de inserir.
      
      const itemsToInsert = await Promise.all(items.map(async (item) => {
        const { data: productData } = await supabase
          .from('products')
          .select('seller_id')
          .eq('id', item.product_id)
          .single()
          
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          user_id: user.id,
          seller_id: productData?.seller_id // Injetando o seller_id
        }
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

      if (itemsError) {
        showError('Erro ao adicionar itens ao pedido: ' + itemsError.message)
        // Tentar reverter o pedido principal
        await supabase.from('orders').delete().eq('id', order.id)
        return
      }

      // 3. Limpar carrinho e redirecionar
      clearCart()
      showSuccess('Pedido confirmado com sucesso!')
      navigate('/encomenda-confirmada')

    } catch (error) {
      showError('Erro inesperado ao processar pedido')
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Faça Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Fazer Login para Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (items.length === 0) {
    navigate('/carrinho')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/carrinho')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o carrinho
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Confirmar Endereço</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Contacto (Telefone) *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+258 XX XXX XXXX"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress" className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Endereço de Entrega *
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleInputChange}
                    required
                    placeholder="Rua, número, bairro, cidade, província"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Confirmar Encomenda'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-green-600">{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Método de Pagamento</span>
                </div>
                <p className="text-sm text-blue-700">
                  Pagamento na Entrega (Dinheiro, M-Pesa, eMola, ou Cartão na entrega, conforme o vendedor)
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  <span>• Frete grátis para todo Moçambique</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>• Prazo de entrega: 1 a 5 dias úteis</span>
                </div>
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span>• Pague apenas quando receber</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Checkout