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

// Interface para pedido processado
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
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
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
  }, [user])

  // 🔥 FUNÇÃO DE DEBUGGING COMPLETA
  const debugDatabase = async () => {
    if (!user) return
    
    console.log('🔍 INICIANDO DEBUGGING COMPLETO')
    const toastId = showLoading('Investigando banco de dados...')
    
    try {
      // 1. Verificar contagem de order_items
      const { data: countData, error: countError } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
      
      // 2. Verificar order_items do seller
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select('*')
        .eq('seller_id', user.id)
        .limit(5)
      
      // 3. Verificar se o seller existe em profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      // 4. Testar query completa
      const { data: testData, error: testError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(*),
          products(*)
        `)
        .eq('seller_id', user.id)
        .limit(3)
      
      const debugResult = {
        userId: user.id,
        userRole: user.profile?.role,
        countData: countData || 'error',
        countError: countError?.message,
        sellerItems: sellerItems || [],
        sellerError: sellerError?.message,
        profileData: profileData || 'not found',
        profileError: profileError?.message,
        testData: testData || [],
        testError: testError?.message
      }
      
      console.log('📊 DEBUG RESULT:', debugResult)
      setDebugInfo(debugResult)
      
      if (testError) {
        setError(`Erro na query principal: ${testError.message}`)
      } else {
        showSuccess('Debugging concluído! Verifique o console.')
      }
      
    } catch (err: any) {
      console.error('❌ ERRO NO DEBUGGING:', err)
      setError(`Erro no debugging: ${err.message}`)
    } finally {
      dismissToast(toastId)
    }
  }

  // 🔥 VERSÃO CORRIGIDA E GARANTIDA
  const fetchOrders = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          price,
          created_at,
          orders!inner(
            id,
            user_id,
            total_amount,
            status,
            delivery_address,
            created_at,
            updated_at
          ),
          products(
            id,
            name,
            image_url
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (sellerError) {
        throw new Error(`Query falhou: ${sellerError.message}`)
      }

      if (!sellerItems || sellerItems.length === 0) {
        setOrders([])
        return
      }

      // Processamento dos dados
      const orderMap = new Map<string, ProcessedOrder>()
      
      sellerItems.forEach((item: any) => {
        const orderId = item.order_id
        
        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            id: item.orders.id,
            user_id: item.orders.user_id,
            total_amount: item.orders.total_amount,
            status: item.orders.status as ProcessedOrder['status'],
            delivery_address: item.orders.delivery_address,
            created_at: item.orders.created_at,
            updated_at: item.orders.updated_at,
            order_items: []
          })
        }
        
        const order = orderMap.get(orderId)!
        order.order_items.push({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          created_at: item.created_at,
          product: {
            name: item.products?.name || 'Produto sem nome',
            image_url: item.products?.image_url
          }
        })
      })
      
      const finalOrders = Array.from(orderMap.values())
      setOrders(finalOrders)
      
    } catch (error: any) {
      console.error('❌ Erro ao buscar pedidos:', error)
      setError(error.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // 🔥 FUNÇÃO ATUALIZADA COM NOTIFICAÇÃO EM TEMPO REAL
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    
    try {
      console.log('🔄 Atualizando pedido:', orderId, 'para', newStatus)
      
      // 1. Atualizar status do pedido
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()

      if (error) {
        console.error('❌ Erro ao atualizar status:', error)
        showError('Erro ao atualizar status: ' + error.message)
        return
      }

      // 2. Enviar notificação (se necessário)
      if (newStatus === 'delivered') {
        // Esta função é mockada no SellerOrders, mas o Realtime no CustomerOrders
        // já cuida da notificação ao cliente.
        console.log('Notificação de entrega simulada enviada ao cliente.')
      }

      // 3. Atualizar estado local
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as ProcessedOrder['status'], updated_at: new Date().toISOString() }
          : order
      ))

      showSuccess(`Pedido #${orderId.slice(0, 8)} atualizado para ${getStatusInfo(newStatus as ProcessedOrder['status']).label}`)
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar pedido:', error)
      showError('Erro inesperado ao atualizar status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // 🔥 FUNÇÃO PARA CONFIGURAR SUBSCRIÇÃO EM TEMPO REAL
  const setupRealtimeSubscription = (userId: string) => {
    console.log(`🔧 Configurando subscrição em tempo real para o usuário ${userId}`)
    
    const channel = supabase
      .channel(`order_status_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Realtime: Order status updated via subscription:', payload)
          
          // Atualiza o estado local
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id 
              ? { ...order, status: payload.new.status as ProcessedOrder['status'], updated_at: payload.new.updated_at }
              : order
          ))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime: Subscription active for user ${userId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Realtime: Subscription error for user ${userId}`)
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
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-gray-600 mt-2">
                Gerencie o status dos seus pedidos em tempo real
                {user && <span className="ml-2 text-sm text-gray-500">({user.id.slice(0, 8)}...)</span>}
              </p>
            </div>
            
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={debugDatabase}
                className="flex items-center"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Debug
              </Button>
              <Button
                variant="outline"
                onClick={fetchOrders}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Painel de Instrução de Fluxo */}
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

        {/* Painel de Debug */}
        {debugInfo && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-yellow-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Informações de Debug
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {debugInfo.userId}</div>
                <div><strong>User Role:</strong> {debugInfo.userRole}</div>
                <div><strong>Total Order Items:</strong> {debugInfo.countData}</div>
                <div><strong>Seller Items Found:</strong> {debugInfo.sellerItems.length}</div>
                <div><strong>Test Query Result:</strong> {debugInfo.testData.length} itens</div>
                {debugInfo.testError && (
                  <div className="text-red-600"><strong>Test Error:</strong> {debugInfo.testError}</div>
                )}
              </div>
              <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Painel de Erro */}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum pedido recebido ainda
              </h2>
              <p className="text-gray-600 mb-6">
                Os clientes ainda não fizeram pedidos com seus produtos.
              </p>
              <Button onClick={debugDatabase} variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Investigar Banco de Dados
              </Button>
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
                        <div className="flex flex-wrap items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(order.created_at)}
                          </div>
                          {/* CORREÇÃO DE RESPONSIVIDADE: Removido 'hidden sm:flex' */}
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
                    
                    {/* Itens do Pedido */}
                    <div className="space-y-3">
                      {order.order_items.slice(0, 1).map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.product.name}</h4>
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

                    {/* Endereço de Entrega */}
                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Endereço de Entrega:</p>
                        <p className="text-sm text-blue-700 break-words">{order.delivery_address}</p>
                      </div>
                    </div>

                    {/* Total do Pedido */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">Total do Pedido:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>

                    {/* Indicador de Notificação Enviada */}
                    {order.status === 'delivered' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Notificação enviada ao cliente!</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          O cliente foi notificado que o pedido foi entregue e pode confirmar o recebimento.
                        </p>
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