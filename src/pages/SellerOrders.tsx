import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ArrowLeft, Package, User, MapPin, Calendar } from 'lucide-react'
import { getStatusInfo, getNextStatuses } from '../utils/orderStatus'
import { showSuccess, showError } from '../utils/toast'

// 🔥 TIPO OTIMIZADO PARA A NOVA QUERY
interface OrderItemWithOrder {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  seller_id: string
  user_id: string
  created_at: string
  
  // Dados do pedido (via inner join)
  orders: {
    id: string
    user_id: string
    total_amount: number
    status: string
    delivery_address: string
    created_at: string
    updated_at: string
  }
  
  // Dados do produto
  products: {
    id: string
    name: string
    image_url?: string
    seller_id: string
  }
}

// 🔥 TIPO CORRETO PARA PEDIDOS PROCESSADOS
interface ProcessedOrder {
  id: string
  user_id: string
  total_amount: number
  status: 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled'
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
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      fetchOrders()
    }
  }, [user])

  // 🔥 QUERY OTIMIZADA - SEM RECURSÃO RLS!
  const fetchOrders = async () => {
    try {
      console.log('🔍 Buscando pedidos para o vendedor:', user!.id)
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(*),
          products(*)
        `)
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro na query de pedidos:', error)
        showError('Erro ao carregar pedidos: ' + error.message)
      } else {
        console.log('✅ Pedidos encontrados:', data?.length || 0)
        console.log('📦 Dados brutos:', data)
        
        // 🔥 PROCESSAMENTO OTIMIZADO: Agrupar por order_id
        const groupedOrders = data?.reduce((acc: Record<string, ProcessedOrder>, item: OrderItemWithOrder) => {
          const orderId = item.order_id
          
          if (!acc[orderId]) {
            // Primeiro item deste pedido - criar estrutura base
            acc[orderId] = {
              id: item.orders.id,
              user_id: item.orders.user_id,
              total_amount: item.orders.total_amount,
              status: item.orders.status as ProcessedOrder['status'],
              delivery_address: item.orders.delivery_address,
              created_at: item.orders.created_at,
              updated_at: item.orders.updated_at,
              order_items: []
            }
          }
          
          // Adicionar este item ao pedido
          acc[orderId].order_items.push({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            created_at: item.created_at,
            product: {
              name: item.products.name,
              image_url: item.products.image_url
            }
          })
          
          return acc
        }, {})
        
        const ordersArray = Object.values(groupedOrders) as ProcessedOrder[]
        console.log('📊 Pedidos processados:', ordersArray)
        setOrders(ordersArray)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar pedidos:', error)
      showError('Erro inesperado ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        showError('Erro ao atualizar status: ' + error.message)
      } else {
        showSuccess('Status atualizado com sucesso!')
        
        // 🔥 ATUALIZAÇÃO OTIMIZADA: Atualizar localmente
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus as ProcessedOrder['status'], updated_at: new Date().toISOString() } : order
        ))
      }
    } catch (error) {
      showError('Erro inesperado ao atualizar status')
      console.error('Update status error:', error)
    } finally {
      setUpdatingStatus(null)
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

  if (user?.profile?.role !== 'vendedor') {
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
          <p className="text-gray-600 mt-2">Visualize e gerencie os pedidos recebidos</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum pedido recebido ainda
              </h2>
              <p className="text-gray-600">
                Os clientes ainda não fizeram pedidos com seus produtos.
              </p>
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
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(order.created_at)}
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            Cliente ID: {order.user_id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                        {nextStatuses.length > 0 && (
                          <Select
                            value=""
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                            disabled={updatingStatus === order.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Atualizar" />
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
                    {/* Itens do Pedido */}
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
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
                    </div>

                    {/* Endereço de Entrega */}
                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Endereço de Entrega:</p>
                        <p className="text-sm text-blue-700">{order.delivery_address}</p>
                      </div>
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerOrders