import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Package, Calendar, CheckCircle, X, AlertTriangle, RefreshCw } from 'lucide-react'
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
      .channel(`customer_orders_${userId}`)
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
          
          if (updatedOrder.status === 'cancelled') {
             // Feedback visual extra se veio de outro lugar (ex: admin)
          } else {
             const statusInfo = getStatusInfo(updatedOrder.status)
             showSuccess(`O status do seu pedido mudou para: ${statusInfo.label}`)
          }
        }
      )
      .subscribe()
      
    return channel
  }

  const handleCancelOrder = async (orderId: string) => {
    const toastId = showLoading('Cancelando pedido...')
    
    // Atualização Otimista Imediata
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'cancelled' } : order
    ))

    try {
      // Executa no banco (agora permitido pela nova política RLS)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user!.id) // Garantia extra de segurança

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Pedido cancelado com sucesso.')
      
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao cancelar pedido: ' + error.message)
      
      // Reverter estado otimista em caso de erro
      fetchOrders() 
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
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 pl-0 hover:bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} title="Atualizar Lista">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><Package className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h2 className="text-xl font-semibold text-gray-900 mb-2">Você ainda não fez nenhum pedido</h2><p className="text-gray-600 mb-6">Comece a comprar para ver seus pedidos aqui.</p><Button onClick={() => navigate('/')}>Começar a Comprar</Button></CardContent></Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              // Só permite cancelar se estiver pendente ou em preparação
              const canCancel = order.status === 'pending' || order.status === 'preparing'
              
              return (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow border-gray-200">
                  <CardHeader className="bg-white border-b pb-3 p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <CardTitle className="text-base md:text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                        <div className="flex items-center mt-1 text-xs md:text-sm text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" /> {formatDate(order.created_at)}
                        </div>
                      </div>
                      <Badge className={`w-fit ${statusInfo.color} text-xs px-2 py-0.5`}>{statusInfo.icon} {statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {order.order_items.map(item => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                            <img src={getFirstImageUrl(item.product.image_url) || defaultImage} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm md:text-base truncate">{item.product.name}</p>
                          <p className="text-xs md:text-sm text-gray-600">{item.quantity} x {formatPrice(item.price)}</p>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm md:text-base">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-dashed gap-3">
                      <div className="font-bold text-base md:text-lg">Total: <span className="text-green-600">{formatPrice(order.total_amount)}</span></div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {canCancel && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="flex-1 sm:flex-none h-9 text-xs md:text-sm"><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center text-red-600"><AlertTriangle className="w-5 h-5 mr-2" />Confirmar Cancelamento</AlertDialogTitle>
                                <AlertDialogDescription>Tem certeza que deseja cancelar o pedido #{order.id.slice(0, 8)}? Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelOrder(order.id)} className="bg-red-600 hover:bg-red-700">Confirmar Cancelamento</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {order.status === 'delivered' && (
                          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none h-9 text-xs md:text-sm"><Link to={`/meus-pedidos/${order.id}`}><CheckCircle className="w-4 h-4 mr-1" /> Confirmar Recebimento</Link></Button>
                        )}
                        <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none h-9 text-xs md:text-sm"><Link to={`/meus-pedidos/${order.id}`}>Ver Detalhes</Link></Button>
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
  )
}

export default CustomerOrders