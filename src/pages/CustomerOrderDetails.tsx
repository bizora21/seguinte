import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Package, MapPin, Calendar, CheckCircle, CreditCard, AlertTriangle, Star, X } from 'lucide-react'
import { getStatusInfo } from '../utils/orderStatus'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { useOrderDetails } from '../hooks/useOrderDetails'
import { getFirstImageUrl } from '../utils/images'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'

const CustomerOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  
  const defaultImage = '/placeholder.svg'

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
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)
        .eq('user_id', user!.id)
        .select()

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Recebimento confirmado! O pagamento ao vendedor será processado.')
      refetch()

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao confirmar recebimento: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    const toastId = showLoading('Cancelando pedido...')
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Pedido cancelado com sucesso.')
      refetch()
      navigate('/meus-pedidos')
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao cancelar pedido: ' + error.message)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md"><CardContent className="p-12 text-center"><AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao Carregar Pedido</h2><p className="text-gray-600 mb-6">{error?.message || 'Pedido não encontrado ou acesso negado.'}</p><Button onClick={() => navigate('/meus-pedidos')}>Voltar para Pedidos</Button></CardContent></Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const canCancel = order.status === 'pending' || order.status === 'preparing'
  const isDelivered = order.status === 'delivered'
  const isCompleted = order.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/meus-pedidos')}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Meus Pedidos</Button>
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><X className="w-4 h-4 mr-1" /> Cancelar Pedido</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-red-500" />Confirmar Cancelamento</AlertDialogTitle>
                  <AlertDialogDescription>Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelOrder} className="bg-red-600 hover:bg-red-700">Confirmar Cancelamento</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Detalhes do Pedido #{order.id.slice(0, 8)}</h1>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Status Atual</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Última atualização: {formatDate(order.updated_at)}</p>
              </div>
              <Badge className={`text-lg py-1 px-3 ${statusInfo.color}`}>{statusInfo.icon} {statusInfo.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {isDelivered && (
              <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center space-y-3">
                <h3 className="text-lg font-semibold text-green-800 flex items-center justify-center"><CheckCircle className="w-5 h-5 mr-2" /> Confirme a Entrega e Pagamento</h3>
                <p className="text-green-700">Se você já recebeu o produto e efetuou o pagamento, confirme abaixo. Isso finaliza o pedido e ajuda o vendedor a receber.</p>
                <Button onClick={handleConfirmReceipt} disabled={submitting} className="bg-green-600 hover:bg-green-700 w-full md:w-auto">{submitting ? 'Confirmando...' : 'Confirmar Recebimento e Pagamento'}</Button>
              </div>
            )}

            {isCompleted && (
              <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg text-center space-y-3">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center justify-center"><Star className="w-5 h-5 mr-2 text-yellow-500" /> Pedido Concluído! Avalie o Vendedor</h3>
                <p className="text-blue-700">Obrigado por comprar na LojaRápida! Sua avaliação é muito importante para a comunidade.</p>
                <Button disabled className="w-full md:w-auto">Avaliar Vendedor (em breve)</Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm font-medium text-gray-900 flex items-center mb-1"><MapPin className="w-4 h-4 mr-2" /> Endereço de Entrega:</p><p className="text-sm text-gray-700">{order.delivery_address}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm font-medium text-gray-900 flex items-center mb-1"><CreditCard className="w-4 h-4 mr-2" /> Total Pago:</p><p className="text-xl font-bold text-green-600">{formatPrice(order.total_amount)}</p></div>
            </div>

            <h3 className="text-lg font-semibold border-t pt-4">Itens Comprados</h3>
            <div className="space-y-3">
              {order.order_items.map((item) => {
                const img = getFirstImageUrl(item.product.image_url) || defaultImage
                return (
                  <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg bg-white">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden"><img src={img} alt={item.product.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = defaultImage }}/></div>
                    <div className="flex-1"><h4 className="font-medium">{item.product.name}</h4><p className="text-sm text-gray-600">{item.quantity}x {formatPrice(item.price)}</p></div>
                    <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
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