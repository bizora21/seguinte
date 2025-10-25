import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Package, MapPin, Calendar } from 'lucide-react'
import { getStatusInfo } from '../utils/orderStatus'
import { showSuccess } from '../utils/toast'

const CustomerOrders = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.profile?.role === 'cliente') {
      fetchOrders()
      
      // Configurar subscrição apenas se o user.id estiver disponível
      if (user.id) {
        const channel = setupRealtimeSubscription(user.id)
        return () => {
          // Cleanup subscription when component unmounts
          supabase.removeChannel(channel)
        }
      }
    }
  }, [user]) // Dependência apenas do objeto user

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

      if (error) {
        console.error('Error fetching orders:', error)
      } else {
        setOrders(data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = (userId: string) => {
    console.log(`Realtime: Setting up subscription for user ${userId}`)
    
    const channel = supabase
      .channel(`orders_user_${userId}`) // Usar um nome de canal único
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}` // Filtrar pelo ID do cliente
        },
        (payload) => {
          console.log('Realtime: Order status updated:', payload)
          
          // CORREÇÃO: Definir updatedOrder a partir de payload.new
          const updatedOrder = payload.new as OrderWithItems;

          // Atualizar o pedido localmente
          setOrders(prev => prev.map(order => 
            order.id === updatedOrder.id 
              ? { ...order, status: updatedOrder.status, updated_at: updatedOrder.updated_at }
              : order
          ))

          // Mostrar notificação
          const statusInfo = getStatusInfo(updatedOrder.status)
          showSuccess(`Pedido #${updatedOrder.id.slice(0, 8)} atualizado: ${statusInfo.icon} ${statusInfo.label}`)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: Subscription active for orders of user ${userId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime: Subscription error')
        }
      })

    return channel
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (user?.profile?.role !== 'cliente') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-600 mt-2">Acompanhe o status dos seus pedidos em tempo real</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Você ainda não fez nenhum pedido
              </h2>
              <p className="text-gray-600 mb-6">
                Comece a comprar para ver seus pedidos aqui.
              </p>
              <Button onClick={() => navigate('/')}>
                Começar a Comprar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              
              return (
                <Link to={`/meus-pedidos/${order.id}`} key={order.id}>
                  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Indicador de atualização em tempo real */}
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 opacity-75"></div>
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                          <div className="flex flex-wrap items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(order.created_at)}
                            </div>
                            {/* CORREÇÃO DE RESPONSIVIDADE: Removido 'hidden sm:flex' */}
                            {order.updated_at !== order.created_at && (
                              <div className="flex items-center text-blue-600 mt-1 sm:mt-0">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></span>
                                Atualizado recentemente
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Itens do Pedido */}
                      <div className="space-y-3">
                        {order.order_items.slice(0, 1).map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                              {item.product.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48&h=48&fit=crop'
                                  }}
                                />
                              ) : (
                                <img
                                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48&h=48&fit=crop"
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
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
                        {order.order_items.length > 1 && (
                          <p className="text-sm text-gray-500 mt-1 ml-4">
                            + {order.order_items.length - 1} item(s)
                          </p>
                        )}
                      </div>

                      {/* Total do Pedido */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-semibold">Total do Pedido:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerOrders