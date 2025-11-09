import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { 
  Plus, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  MessageCircle,
  Eye,
  Store,
  ArrowRight,
  DollarSign,
  BarChart3,
  Settings,
  CreditCard,
  AlertTriangle,
  User,
  XCircle // Ícone para cancelados
} from 'lucide-react'
import { motion } from 'framer-motion'
import SellerFinanceTab from '../components/SellerFinanceTab'
import StoreSettingsTab from '../components/StoreSettingsTab'
import SellerProductsTab from '../components/SellerProductsTab'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      fetchDashboardData()
      
      const orderUpdateChannel = setupOrderUpdateSubscription()
      return () => {
        supabase.removeChannel(orderUpdateChannel)
      }
    }
  }, [user])

  const setupOrderUpdateSubscription = () => {
    const channel = supabase
      .channel(`seller-dashboard-updates-${user!.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Ouvir por INSERT e UPDATE
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const updatedOrder = payload.new as any;
          
          // Verificar se o pedido atualizado pertence a este vendedor
          const isRelevant = recentOrders.some(o => o.id === updatedOrder.id) || 
                             cancelledOrders.some(o => o.id === updatedOrder.id) ||
                             payload.eventType === 'INSERT'; // Se for um novo pedido, é relevante

          if (isRelevant) {
            if (updatedOrder.status === 'cancelled') {
              toast.error(`🚨 Pedido #${updatedOrder.id.slice(0, 8)} foi cancelado pelo cliente.`, {
                duration: 6000,
              });
            } else if (payload.eventType === 'INSERT') {
              toast.success(`🎉 Novo pedido recebido! #${updatedOrder.id.slice(0, 8)}`, {
                duration: 6000,
              });
            }
            // Atualiza todos os dados para refletir a mudança
            fetchDashboardData()
          }
        }
      )
      .subscribe();
    return channel;
  };

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
    { title: 'Total de Produtos', value: formatNumber(stats.totalProducts), icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Pedidos Totais', value: formatNumber(stats.totalOrders), icon: ShoppingBag, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Receita (Concluídos)', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Pedidos Pendentes', value: formatNumber(stats.pendingOrders), icon: BarChart3, color: 'text-orange-600', bgColor: 'bg-orange-50' }
  ]
  
  const actionButtons = [
    { name: 'Gerenciar Pedidos', href: '/meus-pedidos', icon: ShoppingBag, description: 'Visualize e atualize o status de todos os pedidos recebidos.', variant: 'default' as const },
    { name: 'Meus Produtos', href: '/dashboard?tab=products', icon: Package, description: 'Adicione, edite ou exclua seus produtos.', variant: 'default' as const },
    { name: 'Finanças e Comissões', href: '/dashboard?tab=finance', icon: CreditCard, description: 'Monitore suas comissões e gerencie pagamentos.', variant: 'default' as const },
    { name: 'Configurações da Loja', href: '/dashboard?tab=settings', icon: Settings, description: 'Atualize o nome, descrição e categorias da sua loja.', variant: 'outline' as const },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <TooltipProvider>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center space-x-4">
            <Avatar className="h-16 w-16 bg-secondary text-white border-4 border-white shadow-lg">
              <AvatarFallback className="text-2xl font-bold">{getAvatarFallbackText()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Vendedor</h1>
              <p className="text-gray-600">Bem-vindo(a), <span className="font-semibold">{user.profile?.store_name || user.email}!</span></p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto p-1">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="finance">Finanças</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products"><SellerProductsTab /></TabsContent>
            <TabsContent value="settings"><StoreSettingsTab /></TabsContent>
            <TabsContent value="finance"><SellerFinanceTab /></TabsContent>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal (Ações) */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center text-lg"><ShoppingBag className="w-5 h-5 mr-2" />Pedidos Recentes (Ativos)</CardTitle></CardHeader>
                    <CardContent>
                      {recentOrders.length === 0 ? (
                        <div className="text-center py-8"><p className="text-gray-600">Nenhum pedido ativo.</p></div>
                      ) : (
                        <div className="space-y-4">
                          {recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('pt-MZ')}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatPrice(order.total_amount)}</p>
                                <Badge variant="secondary">{order.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button onClick={() => navigate('/meus-pedidos')} className="w-full mt-4">Ver Todos os Pedidos</Button>
                    </CardContent>
                  </Card>

                  {/* 🔥 NOVO: Cartão de Pedidos Cancelados */}
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg text-red-800">
                        <XCircle className="w-5 h-5 mr-2" />
                        Pedidos Cancelados Recentemente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {cancelledOrders.length === 0 ? (
                        <div className="text-center py-8"><p className="text-gray-600">Nenhum pedido cancelado recentemente.</p></div>
                      ) : (
                        <div className="space-y-4">
                          {cancelledOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 border border-red-200 bg-white rounded-lg">
                              <div>
                                <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600">Cancelado em: {new Date(order.updated_at).toLocaleDateString('pt-MZ')}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold line-through">{formatPrice(order.total_amount)}</p>
                                <Badge variant="destructive">Cancelado</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna Lateral (Estatísticas e Atalhos) */}
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Estatísticas Rápidas</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {statCards.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${stat.bgColor}`}>
                              <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Atalhos</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={() => navigate('/adicionar-produto')} className="w-full justify-start"><Plus className="w-4 h-4 mr-2" />Adicionar Novo Produto</Button>
                      <Button onClick={() => navigate(`/loja/${user.id}`)} className="w-full justify-start" variant="outline"><Eye className="w-4 h-4 mr-2" />Ver Minha Loja</Button>
                      <Button onClick={() => navigate('/meus-chats')} className="w-full justify-start" variant="outline"><MessageCircle className="w-4 h-4 mr-2" />Mensagens</Button>
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