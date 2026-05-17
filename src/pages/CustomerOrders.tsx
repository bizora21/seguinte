import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Package, Calendar, CheckCircle, X, AlertTriangle, RefreshCw, Truck, Loader2, PartyPopper } from 'lucide-react'
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
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())

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
  
  const handleTrackOrder = (orderId: string) => {
    // Simulação de rastreamento
    showSuccess(`Rastreamento do Pedido #${orderId.slice(0, 8)} iniciado.`)
    // Em um sistema real, redirecionaria para: navigate(`/rastreamento/${orderId}`)
    window.open('https://www.dhl.com/mz-pt/home/rastreamento.html', '_blank')
  }

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingId(orderId)
    const toastId = showLoading('A confirmar entrega...')
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId)
        .eq('user_id', user!.id)
      if (error) throw error

      dismissToast(toastId)
      // Actualiza estado local para evitar refetch
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o))
      setConfirmedIds(prev => new Set([...prev, orderId]))
      showSuccess('Entrega confirmada! Obrigado por comprar na LojaRápida.')
      // Remove o card de sucesso após 4 segundos
      setTimeout(() => setConfirmedIds(prev => { const n = new Set(prev); n.delete(orderId); return n }), 4000)
    } catch (err: any) {
      dismissToast(toastId)
      showError('Erro ao confirmar: ' + err.message)
    } finally {
      setConfirmingId(null)
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
          <>
          {/* Cards de acção: a_caminho + entregue */}
          {orders.filter(o => o.status === 'in_transit' || o.status === 'delivered' || confirmedIds.has(o.id)).map(order => {
            // Card de sucesso pós-confirmação
            if (confirmedIds.has(order.id)) {
              return (
                <div key={`done-${order.id}`} className="rounded-xl border border-green-300 bg-green-50 p-4 flex items-center gap-4 mb-2 animate-in fade-in duration-500">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Entrega confirmada!</p>
                    <p className="text-sm text-green-700">Obrigado por comprar na LojaRápida. O vendedor receberá o seu pagamento.</p>
                  </div>
                </div>
              )
            }

            // Card "a caminho"
            if (order.status === 'in_transit') {
              return (
                <div key={`transit-${order.id}`} className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-purple-900">Pedido #{order.id.slice(0, 8)} está a caminho!</p>
                      <p className="text-sm text-purple-700 mt-0.5">
                        O vendedor enviou o seu produto. Quando receber, confirme a entrega aqui.
                      </p>
                    </div>
                  </div>
                  <Link to={`/meus-pedidos/${order.id}`} className="flex-shrink-0">
                    <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100 w-full sm:w-auto">
                      Ver detalhes
                    </Button>
                  </Link>
                </div>
              )
            }

            // Card "confirmar entrega"
            return (
              <div key={`confirm-${order.id}`} className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0 mt-0.5">📦</span>
                    <div className="min-w-0">
                      <p className="font-bold text-amber-900">Recebeu o pedido #{order.id.slice(0, 8)}?</p>
                      <p className="text-sm text-amber-800 mt-0.5">
                        Confirme a entrega para proteger a sua compra e ajudar o vendedor a receber o pagamento.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleConfirmDelivery(order.id)}
                    disabled={confirmingId === order.id}
                    className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0 w-full sm:w-auto h-11 text-sm font-semibold"
                  >
                    {confirmingId === order.id
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A confirmar...</>
                      : <><CheckCircle className="w-4 h-4 mr-2" /> ✅ Confirmar que recebi o produto</>
                    }
                  </Button>
                </div>
              </div>
            )
          })}

          <div className="space-y-4 md:space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              // Só permite cancelar se estiver pendente ou em preparação
              const canCancel = order.status === 'pending' || order.status === 'preparing'
              const isInTransit = order.status === 'in_transit'
              
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
                        
                        {/* NOVO BOTÃO DE RASTREAMENTO */}
                        {isInTransit && (
                          <Button 
                            onClick={() => handleTrackOrder(order.id)} 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none h-9 text-xs md:text-sm"
                          >
                            <Truck className="w-4 h-4 mr-1" /> Rastrear Encomenda
                          </Button>
                        )}
                        
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
          </>
        )}
      </div>
    </div>
  )
}

export default CustomerOrders