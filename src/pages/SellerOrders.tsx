import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ArrowLeft, Package, User, MapPin, Calendar, AlertTriangle, RefreshCw, CheckCircle, ChevronDown, Loader2 } from 'lucide-react'
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

    // Ouvir por NOVOS PEDIDOS (Insert na tabela order_items)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_items',
        filter: `seller_id=eq.${sellerId}`
      },
      (payload) => {
        toast.success('🎉 Novo pedido recebido!', { duration: 5000 });
        // Recarrega tudo para garantir consistência
        fetchOrders();
      }
    )

    // Ouvir por ATUALIZAÇÕES (ex: Cliente cancelou ou Admin confirmou pagamento)
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
          // Verifica se o pedido está na lista deste vendedor
          const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
          
          if (orderIndex > -1) {
            // Só notifica se o status mudou "externamente" (não pelo próprio vendedor neste momento)
            // Usamos um truque simples: se updatingStatus for igual ao ID, é o próprio vendedor mexendo
            if (updatingStatus !== updatedOrder.id) {
                if (updatedOrder.status === 'cancelled') {
                    toast.error(`🚨 Pedido #${updatedOrder.id.slice(0, 8)} CANCELADO pelo cliente.`, { duration: 6000 });
                } else if (updatedOrder.status === 'completed') {
                    toast.success(`✅ Pedido #${updatedOrder.id.slice(0, 8)} CONCLUÍDO (Pagamento confirmado).`, { duration: 6000 });
                }
                
                // Atualiza o estado local
                const newOrders = [...prevOrders];
                newOrders[orderIndex] = { 
                    ...newOrders[orderIndex], 
                    status: updatedOrder.status, 
                    updated_at: updatedOrder.updated_at 
                };
                return newOrders;
            }
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
      // 1. Pegar todos os items deste vendedor
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select(`
          order_id
        `)
        .eq('seller_id', user.id)

      if (sellerError) throw new Error(`Query falhou: ${sellerError.message}`)
      
      if (!sellerItems || sellerItems.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // 2. Extrair IDs únicos de pedidos
      const orderIds = [...new Set(sellerItems.map((item: any) => item.order_id))]

      // 3. Buscar os pedidos completos
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
    // O toast de loading foi removido para dar sensação de instantaneidade, 
    // ou podemos manter um muito rápido. Vamos usar um discreto.
    
    try {
      // 1. Chamada ao Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      
      // 2. ATUALIZAÇÃO OTIMISTA (Instantânea)
      // Atualizamos o estado local imediatamente após o sucesso da API,
      // sem esperar o evento de Realtime voltar.
      setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === orderId) {
            // TypeScript trick para garantir tipagem
            const statusTyped = newStatus as ProcessedOrder['status'];
            return { 
                ...order, 
                status: statusTyped, 
                updated_at: new Date().toISOString() 
            };
        }
        return order;
      }));

      // Feedback visual
      const statusInfo = getStatusInfo(newStatus as ProcessedOrder['status']);
      showSuccess(`Status atualizado para: ${statusInfo.label}`);

    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error)
      showError('Erro ao atualizar status: ' + error.message)
      // Se falhar, poderíamos reverter o estado aqui se tivéssemos feito a mudança antes do await
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
              <Button variant="outline" onClick={fetchOrders} className="flex items-center" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
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
                <Card key={order.id} className="transition-all duration-300 hover:shadow-md">
                  <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                            Pedido #{order.id.slice(0, 8)}
                            {order.status === 'cancelled' && <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">CANCELADO</span>}
                        </CardTitle>
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
                        <Badge className={`${statusInfo.color} px-3 py-1 text-sm`}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                        
                        {nextStatuses.length > 0 && order.status !== 'cancelled' && order.status !== 'completed' && (
                          <Select
                            value=""
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                            disabled={updatingStatus === order.id}
                          >
                            <SelectTrigger className="w-full sm:w-40 border-blue-200 hover:border-blue-400 focus:ring-blue-500">
                              {updatingStatus === order.id ? (
                                <div className="flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                                  <span className="text-sm text-blue-600">Atualizando...</span>
                                </div>
                              ) : (
                                <>
                                  <SelectValue placeholder="Alterar Status" />
                                  <ChevronDown className="w-4 h-4 opacity-50 ml-1" />
                                </>
                              )}
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
                  <CardContent className="space-y-4 pt-4">
                    
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border">
                            <img
                              src={getFirstImageUrl(item.product.image_url) || defaultImage}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = defaultImage }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-gray-900">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">{item.quantity}x {formatPrice(item.price)}</p>
                          </div>
                          <div className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">Endereço de Entrega:</p>
                        <p className="text-sm text-blue-800 break-words">{order.delivery_address}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed">
                      <span className="font-medium text-gray-600">Total do Pedido:</span>
                      <span className="text-xl font-extrabold text-green-600">{formatPrice(order.total_amount)}</span>
                    </div>

                    {order.status === 'delivered' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-bold">Entregue! Aguardando confirmação.</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1 pl-7">O cliente foi notificado para confirmar o recebimento e o pagamento.</p>
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