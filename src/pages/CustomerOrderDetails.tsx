import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Package, MapPin, Calendar, CheckCircle, CreditCard, AlertTriangle, Star } from 'lucide-react'
import { getStatusInfo } from '../utils/orderStatus'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { useOrderDetails } from '../hooks/useOrderDetails'
import { getFirstImageUrl } from '../utils/images'

const CustomerOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const { order, isLoading, error, refetch } = useOrderDetails(orderId, user?.id)

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login')
    }
    if (error) {
      showError(error.message || 'Erro ao carregar detalhes do pedido.')
    }
  }, [user, isLoading, error, navigate])

  const handleConfirmReceipt = async () => {
    if (!order) return

    setSubmitting(true)
    const toastId = showLoading('Confirmando recebimento...')

    try {
      // 1. Atualizar status para 'completed'
      // O trigger no Supabase cuidará de calcular a comissão e registrar a transação.
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)
        .eq('user_id', user!.id)
        .select()

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Recebimento confirmado! O pagamento ao vendedor será processado.')
      
      // O hook useOrderDetails deve recarregar via Realtime/React Query
      refetch()

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao confirmar recebimento: ' + error.message)
      console.error('Receipt confirmation error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao Carregar Pedido</h2>
            <p className="text-gray-600 mb-6">{error?.message || 'Pedido não encontrado ou acesso negado.'}</p>
            <Button onClick={() => navigate('/meus-pedidos')}>Voltar para Pedidos</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  // Status 'delivered' significa que o vendedor enviou e o cliente precisa confirmar o recebimento/pagamento
  const isDelivered = order.status === 'delivered'
  const isCompleted = order.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/meus-pedidos')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Meus Pedidos
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Pedido #{order.id.slice(0, 8)}</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Status Atual</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Última atualização: {formatDate(order.updated_at)}</p>
              </div>
              <Badge className={`text-lg py-1 px-3 ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Ação de Confirmação de Recebimento */}
            {isDelivered && (
              <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center space-y-3">
                <h3 className="text-lg font-semibold text-green-800 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmação de Entrega e Pagamento
                </h3>
                <p className="text-green-700">
                  Se você já recebeu o produto e efetuou o pagamento ao agente de entrega, por favor, confirme abaixo. 
                  Isso finaliza o pedido e libera o pagamento ao vendedor.
                </p>
                <Button
                  onClick={handleConfirmReceipt}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar Recebimento'}
                </Button>
              </div>
            )}

            {isCompleted && (
              <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg text-center space-y-3">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Pedido Concluído
                </h3>
                <p className="text-blue-700">
                  Obrigado por comprar na LojaRápida! O pagamento ao vendedor foi processado.
                </p>
                
                {/* Instrução de Avaliação */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-900 flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" />
                    Ajude o Vendedor!
                  </h4>
                  <p className="text-sm text-gray-700">
                    Sua confirmação garante a melhor avaliação para o vendedor. 
                    Em breve, você poderá deixar uma avaliação detalhada sobre o produto e a loja.
                  </p>
                </div>
              </div>
            )}

            {/* Detalhes do Pedido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 flex items-center mb-1">
                  <MapPin className="w-4 h-4 mr-2" /> Endereço de Entrega:
                </p>
                <p className="text-sm text-gray-700">{order.delivery_address}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 flex items-center mb-1">
                  <CreditCard className="w-4 h-4 mr-2" /> Total Pago:
                </p>
                <p className="text-xl font-bold text-green-600">{formatPrice(order.total_amount)}</p>
              </div>
            </div>

            {/* Itens do Pedido */}
            <h3 className="text-lg font-semibold border-t pt-4">Itens Comprados</h3>
            <div className="space-y-3">
              {order.order_items.map((item) => {
                const img = getFirstImageUrl(item.product.image_url) || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48&h=48&fit=crop'
                return (
                  <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg bg-white">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48&h=48&fit=crop'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.quantity}x {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CustomerOrderDetails