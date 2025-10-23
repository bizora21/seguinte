import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Package, MapPin, Calendar, CheckCircle, CreditCard } from 'lucide-react'
import { getStatusInfo } from '../utils/orderStatus'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import LoadingSpinner from '../components/LoadingSpinner'

const CustomerOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (orderId && user?.profile?.role === 'cliente') {
      fetchOrderDetails()
    } else if (!user) {
      navigate('/login')
    }
  }, [orderId, user])

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              name,
              image_url
            )
          )
        `)
        .eq('id', orderId!)
        .eq('user_id', user!.id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order details:', error)
      showError('Pedido não encontrado ou acesso negado.')
      navigate('/meus-pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!order) return

    setSubmitting(true)
    const toastId = showLoading('Confirmando pagamento...')

    try {
      // Atualizar status para 'completed'
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)
        .eq('user_id', user!.id) // Garantir que apenas o cliente possa atualizar

      if (error) throw error

      // Atualizar estado local
      setOrder(prev => prev ? { ...prev, status: 'completed' as OrderWithItems['status'] } : null)
      
      dismissToast(toastId)
      showSuccess('Pagamento confirmado! O vendedor será notificado para gerar a comissão.')

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao confirmar pagamento: ' + error.message)
      console.error('Payment confirmation error:', error)
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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (!order) return null // Redirecionamento já tratado no useEffect

  const statusInfo = getStatusInfo(order.status)
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
            
            {/* Ação de Confirmação de Pagamento */}
            {isDelivered && (
              <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center space-y-3">
                <h3 className="text-lg font-semibold text-green-800 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagamento Pendente de Confirmação
                </h3>
                <p className="text-green-700">
                  Se você já recebeu o produto e efetuou o pagamento ao agente de entrega, por favor, confirme abaixo.
                </p>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar Pagamento Efectuado'}
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
                  O pagamento foi confirmado. Obrigado por comprar na LojaRápida!
                </p>
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
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg bg-white">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-full h-full p-2 text-gray-400" />
                    )}
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CustomerOrderDetails