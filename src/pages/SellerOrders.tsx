import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ArrowLeft, Package, User, MapPin, Calendar, AlertTriangle, RefreshCw, CheckCircle, ChevronDown } from 'lucide-react'
import { getStatusInfo, getNextStatuses } from '../utils/orderStatus'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import toast from 'react-hot-toast'
import { getFirstImageUrl } from '../utils/images'

interface ProcessedOrder {
  id: string
  user_id: string
  total_amount: number
  status: 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'completed' | 'cancelled'
  delivery_address: string
  created_at: string
  updated_at: string
  order_items: Array<{
    id: string
    order_id: string
    product_id: string
    quantity: number
    price: number
    created_at: string
    product: {
      name: string
      image_url?: string
    }
  }>
}

const SellerOrders = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<ProcessedOrder[]>([])
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const defaultImage = '/placeholder.svg'

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      fetchOrders()
      
      if (user.id) {
        const channel = setupRealtimeSubscription(user.id)
        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [user])

  const setupRealtimeSubscription = (sellerId: string) => {
    const channel = supabase.channel(`seller-orders-channel-${sellerId}`)

    // Ouvir por NOVOS PEDIDOS
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_items',
        filter: `seller_id=eq.${sellerId}`
      },
      (payload) => {
        toast.success('🎉 Novo pedido recebido! Atualizando a lista...', { duration: 5000 });
        fetchOrders();
      }
    )

    // Ouvir por ATUALIZAÇÕES DE STATUS (ex: cancelamento pelo cliente)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      },
      (payload) => {
        const updatedOrder = payload.new as ProcessedOrder;
        
        setOrders(prevOrders => {
          const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
          
          // Se o pedido existe na lista, atualize-o
          if (orderIndex > -1) {
            const oldStatus = prevOrders[orderIndex].status;
            if (oldStatus !== updatedOrder.status) {
              const statusInfo = getStatusInfo(updatedOrder.status);
              toast.success(`Pedido #${updatedOrder.id.slice(0, 8)} atualizado: ${statusInfo.icon} ${statusInfo.label}`);
            }
            
            const newOrders = [...prevOrders];
            newOrders[orderIndex] = { ...newOrders[orderIndex], status: updatedOrder.status, updated_at: updatedOrder.updated_at };
            return newOrders;
          }
          
          return prevOrders;
        });
      }
    )
    .subscribe();

    return channel;
  };

  const fetchOrders = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          orders!inner(
            id, user_id, total_amount, status, delivery_address, created_at, updated_at
          )
        `)
        .eq('seller_id', user.id)

      if (sellerError) throw new Error(`Query falhou: ${sellerError.message}`)
      if (!sellerItems || sellerItems.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      const orderIds = [...new Set(sellerItems.map((item: any) => item.order_id))]

      const { data: ordersWithItems, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products ( name, image_url )
          )
        `)
        .in('id', orderIds)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      setOrders(ordersWithItems || [])
      
    } catch (error: any) {
      console.error('❌ Erro ao buscar pedidos:', error)
      setError(error.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    const toastId = showLoading('Atualizando status...')
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        throw error
      }
      
      // A atualização do estado local agora é tratada pelo subscription em tempo real,
      // garantindo que a UI reflita o estado real do banco de dados.
      dismissToast(toastId)
      // A notificação de sucesso será exibida pelo listener do realtime.

    } catch (error: any) {
      dismissToast(toastId)
      console.error('❌ Erro ao atualizar status:', error)
      showError('Erro ao atualizar status: ' + error.message)
    } finally {
      setUpdatingStatus(null)
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

  if (user?.profile?.role !== 'vendedor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle className="text-center text-red-600">Acesso Negado</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">Voltar para a página inicial</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-gray-600 mt-2">Gerencie o status dos seus pedidos em tempo real</p>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Button variant="outline" onClick={fetchOrders} className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 mt-1 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Fluxo de Pedidos (Confiança do Cliente)</h3>
                <p className="text-sm text-blue-700">
                  Mantenha o cliente informado atualizando o status: 
                  <span className="font-bold"> Pendente </span> 
                  → <span className="font-bold"> Em Preparação </span> 
                  → <span className="font-bold"> A Caminho </span> 
                  → <span className="font-bold"> Entregue </span>. 
                  O cliente confirmará o recebimento para finalizar o pedido como <span className="font-bold"> Concluído</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Erro:</span>
                <span className="ml-2">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido recebido ainda</h2>
              <p className="text-gray-600 mb-6">Os clientes ainda não fizeram pedidos com seus produtos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const nextStatuses = getNextStatuses(order.status)
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                        <div className="flex flex-wrap items-center gap-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(order.created_at)}
                          </div>
                          {order.updated_at !== order.created_at && (
                            <div className="flex items-center text-blue-600 mt-1 sm:mt-0">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              <span className="text-blue-700">Atualizado recentemente</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-3 sm:mt-0">
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                        
                        {nextStatuses.length > 0 && (
                          <Select
                            value=""
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                            disabled={updatingStatus === order.id}
                          >
                            <SelectTrigger className="w-full sm:w-32">
                              <SelectValue placeholder="Atualizar" />
                              <ChevronDown className="w-4 h-4 opacity-50 ml-1" />
                            </SelectTrigger>
                            <SelectContent>
                              {nextStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.icon} {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getFirstImageUrl(item.product.image_url) || defaultImage}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = defaultImage }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">{item.quantity}x {formatPrice(item.price)}</p>
                          </div>
                          <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Endereço de Entrega:</p>
                        <p className="text-sm text-blue-700 break-words">{order.delivery_address}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">Total do Pedido:</span>
                      <span className="text-xl font-bold text-green-600">{formatPrice(order.total_amount)}</span>
                    </div>

                    {order.status === 'delivered' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Notificação enviada ao cliente!</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">O cliente foi notificado que o pedido foi entregue e pode confirmar o recebimento.</p>
                      </div>
                    )}
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

export default SellerOrders