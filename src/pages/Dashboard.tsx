import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { TooltipProvider } from '../components/ui/tooltip'
import {
  Plus,
  ShoppingBag,
  Package,
  DollarSign,
  BarChart3,
  XCircle,
  Store,
  AlertTriangle,
  Bell,
  X
} from 'lucide-react'
import SellerFinanceTab from '../components/SellerFinanceTab'
import StoreSettingsTab from '../components/StoreSettingsTab'
import SellerProductsTab from '../components/SellerProductsTab'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([])
  const [pendingCommissionsTotal, setPendingCommissionsTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [newOrderAlerts, setNewOrderAlerts] = useState<Array<{
    orderId: string
    customerName: string
    amount: number
    productName: string
    time: string
  }>>([])
  const [unreadOrderCount, setUnreadOrderCount] = useState(0)

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      fetchDashboardData()

      const newOrderChannel = setupNewOrderSubscription()
      const updateChannel = setupOrderUpdateSubscription()
      return () => {
        supabase.removeChannel(newOrderChannel)
        supabase.removeChannel(updateChannel)
      }
    }
  }, [user])

  // Escuta order_items INSERT filtrado por seller_id — dispara APÓS o item estar inserido
  const setupNewOrderSubscription = () => {
    return supabase
      .channel(`new-order-items-${user!.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_items', filter: `seller_id=eq.${user!.id}` },
        async (payload) => {
          const item = payload.new as any

          const [{ data: order }, { data: product }] = await Promise.all([
            supabase.from('orders').select('id, customer_name, total_amount').eq('id', item.order_id).single(),
            supabase.from('products').select('name').eq('id', item.product_id).single(),
          ])

          const alert = {
            orderId: item.order_id,
            customerName: order?.customer_name || 'Cliente',
            amount: order?.total_amount ?? item.price,
            productName: product?.name || 'Produto',
            time: new Date().toISOString(),
          }

          setNewOrderAlerts(prev => [alert, ...prev].slice(0, 5))
          setUnreadOrderCount(prev => prev + 1)
          toast.success(`🎉 Nova encomenda recebida!`, { duration: 6000 })
          fetchDashboardData()
        }
      )
      .subscribe()
  }

  // Escuta UPDATE em orders para detectar cancelamentos do lado do cliente
  const setupOrderUpdateSubscription = () => {
    return supabase
      .channel(`seller-order-updates-${user!.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as any
          const wasOurs = recentOrders.some(o => o.id === updated.id) || cancelledOrders.some(o => o.id === updated.id)
          if (wasOurs && updated.status === 'cancelled') {
            toast.error(`🚨 Pedido #${updated.id.slice(0, 8)} foi cancelado.`, { duration: 6000 })
            fetchDashboardData()
          }
        }
      )
      .subscribe()
  }

  const fetchDashboardData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: sellerOrderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('seller_id', user.id)

      if (itemsError) throw itemsError
      if (!sellerOrderItems || sellerOrderItems.length === 0) {
        setStats({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });
        setRecentOrders([]);
        setCancelledOrders([]);
        setLoading(false);
        return;
      }

      const orderIds = [...new Set(sellerOrderItems.map(item => item.order_id))]

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id)

      const recent = orders.filter(o => o.status !== 'cancelled' && o.status !== 'completed').slice(0, 5)
      const cancelled = orders.filter(o => o.status === 'cancelled').slice(0, 5)
      
      const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + order.total_amount, 0)

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders: orders.filter(o => o.status === 'pending').length
      })

      setRecentOrders(recent)
      setCancelledOrders(cancelled)

      const { data: pendingCommissions } = await supabase
        .from('commissions')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('status', 'pending')

      const total = (pendingCommissions ?? []).reduce((sum, c) => sum + (c.amount ?? 0), 0)
      setPendingCommissionsTotal(total)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-MZ').format(num)
  }
  
  const getAvatarFallbackText = () => {
    if (!user) return '?'
    const profile = user.profile
    if (profile?.store_name) {
      return profile.store_name.slice(0, 2).toUpperCase()
    }
    return user.email.charAt(0).toUpperCase()
  }

  if (user?.profile?.role !== 'vendedor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle className="text-center text-red-600">Acesso Restrito</CardTitle></CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">Esta área é exclusiva para vendedores.</p>
            <Button onClick={() => navigate('/')} className="w-full">Voltar para Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const statCards = [
    { title: 'Produtos', value: formatNumber(stats.totalProducts), icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Pedidos', value: formatNumber(stats.totalOrders), icon: ShoppingBag, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Receita', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Pendentes', value: formatNumber(stats.pendingOrders), icon: BarChart3, color: 'text-orange-600', bgColor: 'bg-orange-50' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <TooltipProvider>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Mobile Otimizado */}
          <div className="mb-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 bg-secondary text-white border-2 border-white shadow-sm">
              <AvatarFallback className="text-lg sm:text-2xl font-bold">{getAvatarFallbackText()}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Dashboard</h1>
              <p className="text-sm text-gray-600">Olá, <span className="font-semibold">{user.profile?.store_name || user.email}</span></p>
            </div>
            {unreadOrderCount > 0 && (
              <button
                onClick={() => setUnreadOrderCount(0)}
                className="relative p-2.5 rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                aria-label="Novas encomendas"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                </span>
              </button>
            )}
          </div>

          <Tabs defaultValue={tabParam || "overview"} className="space-y-6">
            {/* Tabs Responsivas: 2 colunas no mobile, 4 no desktop */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-white border shadow-sm rounded-xl">
              <TabsTrigger value="overview" className="py-2.5">Visão Geral</TabsTrigger>
              <TabsTrigger value="products" className="py-2.5">Produtos</TabsTrigger>
              <TabsTrigger value="finance" className="py-2.5">Finanças</TabsTrigger>
              <TabsTrigger value="settings" className="py-2.5">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="animate-in fade-in duration-300"><SellerProductsTab /></TabsContent>
            <TabsContent value="settings" className="animate-in fade-in duration-300"><StoreSettingsTab /></TabsContent>
            <TabsContent value="finance" className="animate-in fade-in duration-300"><SellerFinanceTab /></TabsContent>
            
            <TabsContent value="overview" className="animate-in fade-in duration-300">
              {newOrderAlerts.length > 0 && (
                <div className="mb-6 space-y-3">
                  {newOrderAlerts.map((alert, idx) => (
                    <div key={`${alert.orderId}-${idx}`} className="rounded-xl border border-green-300 bg-green-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-green-100 border border-green-300 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-green-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-green-900 text-sm">🔔 Nova encomenda recebida!</p>
                          <p className="text-sm text-green-800 mt-0.5 truncate">
                            <span className="font-medium">{alert.customerName}</span> quer <span className="font-medium">"{alert.productName}"</span>
                          </p>
                          <p className="text-sm font-bold text-green-700 mt-0.5">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(alert.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => navigate('/meus-pedidos')}
                        >
                          Ver encomenda
                        </Button>
                        <button
                          onClick={() => setNewOrderAlerts(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-full text-green-700 hover:bg-green-200 transition-colors"
                          aria-label="Dispensar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingCommissionsTotal > 0 && (
                <div className="mb-6 rounded-xl border border-orange-300 bg-orange-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-orange-900">Taxa de plataforma pendente: {formatPrice(pendingCommissionsTotal)}</p>
                      <p className="text-sm text-orange-700 mt-0.5">
                        Tens 3 dias para pagar a taxa de 8%. Após esse prazo, o acesso à tua conta pode ser suspenso.
                      </p>
                      <p className="text-sm font-semibold text-orange-800 mt-1">
                        Envia via M-Pesa para: <span className="font-bold">258 84 684 3135</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                    onClick={() => navigate('/meus-pedidos')}
                  >
                    Ver encomendas pendentes
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Estatísticas Rápidas (Mobile Only - Cards Compactos) */}
                  <div className="grid grid-cols-2 gap-3 md:hidden">
                    {statCards.map((stat, index) => (
                      <Card key={index} className="border shadow-sm">
                        <CardContent className="p-3 flex flex-col items-center text-center">
                          <div className={`p-1.5 rounded-full ${stat.bgColor} mb-2`}>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                          </div>
                          <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                          <p className="text-sm font-bold text-gray-900 truncate w-full">{stat.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pedidos Recentes */}
                  <Card>
                    <CardHeader className="py-4"><CardTitle className="text-base flex items-center"><ShoppingBag className="w-4 h-4 mr-2" />Pedidos Ativos</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                      {recentOrders.length === 0 ? (
                        <div className="text-center py-6"><p className="text-sm text-gray-500">Sem pedidos ativos.</p></div>
                      ) : (
                        <div className="space-y-3">
                          {recentOrders.map((order) => (
                            <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-gray-50/50 gap-2">
                              <div>
                                <p className="font-semibold text-sm">#{order.id.slice(0, 8)}</p>
                                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('pt-MZ')}</p>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                <Badge variant="outline" className="bg-white text-xs">{order.status}</Badge>
                                <p className="font-bold text-sm text-green-700">{formatPrice(order.total_amount)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button onClick={() => navigate('/meus-pedidos')} variant="outline" size="sm" className="w-full mt-4">Ver Detalhes</Button>
                    </CardContent>
                  </Card>

                  {/* Pedidos Cancelados */}
                  <Card className="border-red-100 bg-red-50/30">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base flex items-center text-red-800">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelados Recentemente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {cancelledOrders.length === 0 ? (
                        <div className="text-center py-6"><p className="text-sm text-gray-500">Sem cancelamentos recentes.</p></div>
                      ) : (
                        <div className="space-y-3">
                          {cancelledOrders.map((order) => (
                            <div key={order.id} className="flex justify-between items-center p-3 border border-red-100 bg-white rounded-lg">
                              <div>
                                <p className="font-semibold text-sm text-red-900">#{order.id.slice(0, 8)}</p>
                                <p className="text-xs text-gray-500">{new Date(order.updated_at).toLocaleDateString('pt-MZ')}</p>
                              </div>
                              <p className="font-medium text-sm line-through text-gray-400">{formatPrice(order.total_amount)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna Lateral (Estatísticas Desktop + Atalhos) */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Estatísticas (Desktop Only) */}
                  <Card className="hidden md:block">
                    <CardHeader className="py-4"><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      {statCards.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className={`p-1.5 rounded-md mr-3 ${stat.bgColor}`}>
                              <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-600">{stat.title}</span>
                          </div>
                          <span className="font-bold text-gray-900">{stat.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4"><CardTitle className="text-base">Acesso Rápido</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <Button onClick={() => navigate('/adicionar-produto')} className="w-full justify-start h-10 text-sm" variant="default"><Plus className="w-4 h-4 mr-2" />Novo Produto</Button>
                      <Button onClick={() => navigate('/meus-pedidos')} className="w-full justify-start h-10 text-sm" variant="secondary"><ShoppingBag className="w-4 h-4 mr-2" />Pedidos</Button>
                      <Button onClick={() => navigate(`/loja/${user.id}`)} className="w-full justify-start h-10 text-sm" variant="outline"><Store className="w-4 h-4 mr-2" />Minha Loja Pública</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </div>
  )
}

export default Dashboard