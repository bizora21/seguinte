import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Package, Calendar, CheckCircle, X, AlertTriangle } from 'lucide-react'
import { getStatusInfo } from '../utils/orderStatus'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import LoadingSpinner from '../components/LoadingSpinner'
import { getFirstImageUrl } from '../utils/images'

const CustomerOrders = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingOrder, setCancellingOrder] = useState<OrderWithItems | null>(null)
  
  const defaultImage = '/placeholder.svg'

  useEffect(() => {
    if (user?.profile?.role === 'cliente') {
      fetchOrders()
      
      if (user.id) {
        const channel = setupRealtimeSubscription(user.id)
        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = (userId: string) => {
    const channel = supabase
      .channel(`orders_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedOrder = payload.new as OrderWithItems;
          setOrders(prev => prev.map(order => 
            order.id === updatedOrder.id 
              ? { ...order, status: updatedOrder.status, updated_at: updatedOrder.updated_at }
              : order
          ))
          const statusInfo = getStatusInfo(updatedOrder.status)
          showSuccess(`Pedido #${updatedOrder.id.slice(0, 8)} atualizado: ${statusInfo.icon} ${statusInfo.label}`)
        }
      )
      .subscribe()
    return channel
  }

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return

    const toastId = showLoading('Cancelando pedido...')
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', cancellingOrder.id)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Pedido cancelado com sucesso.')
      setOrders(prev => prev.map(o => o.id === cancellingOrder.id ? { ...o, status: 'cancelled' } : o))
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao cancelar pedido: ' + error.message)
    } finally {
      setCancellingOrder(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString))
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
            <p className="text-gray-600 mt-2">Acompanhe o status dos seus pedidos em tempo real</p>
          </div>

          {orders.length === 0 ? (
            <Card><CardContent className="p-12 text-center"><Package className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h2 className="text-xl font-semibold text-gray-900 mb-2">Você ainda não fez nenhum pedido</h2><p className="text-gray-600 mb-6">Comece a comprar para ver seus pedidos aqui.</p><Button onClick={() => navigate('/')}>Começar a Comprar</Button></CardContent></Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                const canCancel = order.status === 'pending' || order.status === 'preparing'
                
                return (
                  <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gray-50 border-b">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                          <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                          <div className="flex items-center mt-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" /> {formatDate(order.created_at)}
                          </div>
                        </div>
                        <Badge className={`mt-2 sm:mt-0 ${statusInfo.color}`}>{statusInfo.icon} {statusInfo.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <img src={getFirstImageUrl(item.product.image_url) || defaultImage} alt={item.product.name} className="w-16 h-16 object-cover rounded-md" />
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">{item.quantity} x {formatPrice(item.price)}</p>
                          </div>
                          <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t">
                        <div className="font-semibold">Total: <span className="text-xl text-green-600">{formatPrice(order.total_amount)}</span></div>
                        <div className="flex space-x-2 mt-4 sm:mt-0">
                          {canCancel && (
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" onClick={() => setCancellingOrder(order)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                            </AlertDialogTrigger>
                          )}
                          {order.status === 'delivered' && (
                            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700"><Link to={`/meus-pedidos/${order.id}`}><CheckCircle className="w-4 h-4 mr-1" /> Confirmar Recebimento</Link></Button>
                          )}
                          <Button asChild variant="outline" size="sm"><Link to={`/meus-pedidos/${order.id}`}>Ver Detalhes</Link></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={!!cancellingOrder} onOpenChange={() => setCancellingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-red-500" />Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja cancelar o pedido #{cancellingOrder?.id.slice(0, 8)}? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-red-600 hover:bg-red-700">Confirmar Cancelamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CustomerOrders