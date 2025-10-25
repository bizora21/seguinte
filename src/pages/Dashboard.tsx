import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
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
  User
} from 'lucide-react'
import { motion } from 'framer-motion'
import SellerFinanceTab from '../components/SellerFinanceTab'
import StoreSettingsTab from '../components/StoreSettingsTab'
import SellerProductsTab from '../components/SellerProductsTab' // Importado
import { Avatar, AvatarFallback } from '../components/ui/avatar'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Buscar estatísticas de produtos
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user!.id)

      // Buscar estatísticas de pedidos
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              seller_id
            )
          )
        `)
        .in('order_items.product.seller_id', [user!.id])
        .order('created_at', { ascending: false })
        .limit(5)

      // Calcular estatísticas
      const sellerOrders = orders?.filter(order => 
        order.order_items?.some(item => 
          item.product?.seller_id === user!.id
        )
      ) || []

      const totalRevenue = sellerOrders.reduce((sum, order) => {
        const sellerItems = order.order_items?.filter(item => 
          item.product?.seller_id === user!.id
        ) || []
        const orderTotal = sellerItems.reduce((itemSum, item) => 
          itemSum + (item.price * item.quantity), 0
        )
        return sum + orderTotal
      }, 0)

      const pendingCount = sellerOrders.filter(order => 
        order.status === 'pending'
      ).length

      setStats({
        totalProducts: products?.length || 0,
        totalOrders: sellerOrders.length,
        totalRevenue,
        pendingOrders: pendingCount
      })

      setRecentOrders(sellerOrders.slice(0, 3))
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
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              Esta área é exclusiva para vendedores.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para Home
            </Button>
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
    {
      title: 'Total de Produtos',
      value: formatNumber(stats.totalProducts),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pedidos Totais',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Receita Total',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Pedidos Pendentes',
      value: formatNumber(stats.pendingOrders),
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-5%',
      changeType: 'negative'
    }
  ]
  
  // Botões de Ação CONSOLIDADOS
  const actionButtons = [
    { 
      name: 'Gerenciar Pedidos', 
      href: '/meus-pedidos', 
      icon: ShoppingBag, 
      description: 'Visualize e atualize o status de todos os pedidos recebidos.',
      variant: 'default' as const
    },
    { 
      name: 'Meus Produtos', 
      href: '/dashboard?tab=products', 
      icon: Package, 
      description: 'Adicione, edite ou exclua seus produtos.',
      variant: 'default' as const
    },
    { 
      name: 'Finanças e Comissões', 
      href: '/dashboard?tab=finance', 
      icon: CreditCard, 
      description: 'Monitore suas comissões e gerencie pagamentos.',
      variant: 'default' as const
    },
    { 
      name: 'Configurações da Loja', 
      href: '/dashboard?tab=settings', 
      icon: Settings, 
      description: 'Atualize o nome, descrição e categorias da sua loja.',
      variant: 'outline' as const
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header com Avatar */}
        <div className="mb-8 flex items-center space-x-4">
          <Avatar className="h-16 w-16 bg-secondary text-white border-4 border-white shadow-lg">
            {/* Aqui você usaria user.profile?.store_logo se estivesse implementado */}
            <AvatarFallback className="text-2xl font-bold">
              {getAvatarFallbackText()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Dashboard Vendedor
            </h1>
            <p className="text-gray-600">
              Bem-vindo(a), <span className="font-semibold">{user.profile?.store_name || user.email}!</span>
            </p>
          </div>
        </div>

        {/* Ações Principais Destacadas (Layout responsivo) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {actionButtons.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => navigate(action.href)}
                  className={`h-24 flex flex-col justify-center items-center text-center p-2 transition-all duration-300 shadow-md ${
                    // Destaque para Finanças e Pedidos
                    action.name === 'Finanças e Comissões' || action.name === 'Gerenciar Pedidos'
                      ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-800'
                      : 'bg-white hover:bg-gray-100 border-2 border-gray-300 text-gray-800'
                  }`}
                  variant={action.variant}
                >
                  <action.icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold mt-1 text-center leading-tight">{action.name}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Stats Grid (Layout responsivo: 2 colunas em mobile, 4 em desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-xs font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-xs text-gray-500 ml-1 hidden sm:inline">vs mês passado</span>
                      </div>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          {/* Tabs List responsiva */}
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto p-1">
            <TabsTrigger value="overview" className="py-2 text-xs sm:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="activity" className="py-2 text-xs sm:text-sm">Atividade</TabsTrigger>
            <TabsTrigger value="products" className="py-2 text-xs sm:text-sm">Produtos</TabsTrigger>
            <TabsTrigger value="finance" className="py-2 text-xs sm:text-sm">Finanças</TabsTrigger>
            <TabsTrigger value="settings" className="py-2 text-xs sm:text-sm">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <SellerProductsTab />
          </TabsContent>

          <TabsContent value="settings">
            <StoreSettingsTab />
          </TabsContent>
          
          <TabsContent value="finance">
            <SellerFinanceTab />
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="space-y-6">
              {/* Pedidos Recentes */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Pedidos Recentes
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/meus-pedidos')}
                  >
                    Ver Todos
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum pedido recebido ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString('pt-MZ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total_amount)}</p>
                            <Badge 
                              variant={order.status === 'pending' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {order.status === 'pending' ? 'Pendente' : 
                               order.status === 'preparing' ? 'Preparando' :
                               order.status === 'in_transit' ? 'A Caminho' : 'Entregue'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Instrução de Confiança */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-800 text-lg">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Aviso Importante: Confiança do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700 mb-4">
                    Assim que um cliente fizer uma encomenda, você deve ir para a seção **Gerenciar Pedidos** e atualizar o status para **"Em Preparação"**.
                  </p>
                  <p className="text-sm text-yellow-700 font-semibold">
                    Isso garante que o cliente saiba que o pedido está sendo processado, aumentando a confiança e reduzindo cancelamentos.
                  </p>
                  <Button
                    onClick={() => navigate('/meus-pedidos')}
                    className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white w-full"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Ir para Gerenciar Pedidos
                  </Button>
                </CardContent>
              </Card>
              
              {/* Minha Loja Pública */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Store className="w-5 h-5 mr-2" />
                      Minha Loja Pública
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Veja como sua loja aparece para os clientes
                    </p>
                    <Button
                      onClick={() => navigate(`/loja/${user.id}`)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Minha Loja
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Outras Ações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Comunicação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => navigate('/meus-chats')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Mensagens com Clientes
                    </Button>
                    <Button
                      onClick={() => navigate('/politica-vendedor')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Política do Vendedor
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard