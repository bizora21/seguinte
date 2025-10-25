import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, DollarSign, TrendingUp, Users, Package, AlertCircle, CheckCircle, Clock, RefreshCw, Filter, ChevronDown, Calendar as CalendarIcon } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { OrderWithItems } from '../types/order'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

// Defina o email do administrador aqui
const ADMIN_EMAIL = 'lojarapidamz@outlook.com'

interface Commission {
  id: string
  order_id: string
  seller_id: string
  amount: number
  status: 'pending' | 'paid'
  created_at: string
  seller: {
    store_name: string
    email: string
  }
  order: {
    id: string
    total_amount: number
  }
}

// Interface para pedidos que precisam de confirmação (status 'delivered')
interface DeliveredOrder {
  id: string
  user_id: string
  total_amount: number
  status: 'delivered'
  delivery_address: string
  created_at: string
  updated_at: string
  order_items: Array<{
    id: string
    product_id: string
    quantity: number
    price: number
    seller_id: string
    product: Array<{
      name: string
    }>
  }>
}

interface FinancialTransaction {
  id: string
  order_id: string
  seller_id: string
  commission_amount: number
  status: string
  created_at: string
  seller?: {
    store_name: string
    email: string
  }
  order?: {
    id: string
    total_amount: number
  }
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filtros da tabela de transações
  const [statusFilter, setStatusFilter] = useState<'all' | 'commission_deducted'>('all')
  const [sellerQuery, setSellerQuery] = useState('')
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d'>('all')

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL) {
      navigate('/')
      return
    }
    fetchDashboardData()
    fetchTransactions()
  }, [user, navigate])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          seller:profiles!financial_transactions_seller_id_fkey (
            store_name,
            email
          ),
          order:orders!financial_transactions_order_id_fkey (
            id,
            total_amount
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      showError('Erro ao carregar transações financeiras')
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Buscar Comissões (para estatísticas e histórico)
      const { data: commissionData, error: commissionError } = await supabase
        .from('commissions')
        .select(`
          *,
          seller:profiles!commissions_seller_id_fkey (
            store_name,
            email
          ),
          order:orders (
            id,
            total_amount
          )
        `)
        .order('created_at', { ascending: false })

      if (commissionError) throw commissionError

      setCommissions(commissionData || [])
      
      const pending = commissionData?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0
      const paid = commissionData?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0
      
      setStats({
        totalPending: commissionData?.filter(c => c.status === 'pending').length || 0,
        totalPaid: commissionData?.filter(c => c.status === 'paid').length || 0,
        totalRevenue: paid
      })

      // 2. Buscar Pedidos Entregues (Aguardando Confirmação do Cliente)
      const { data: deliveredData, error: deliveredError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          total_amount,
          status,
          delivery_address,
          created_at,
          updated_at,
          order_items (
            id,
            product_id,
            quantity,
            price,
            seller_id,
            product:products ( name )
          )
        `)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: true })

      if (deliveredError) throw deliveredError
      setDeliveredOrders(deliveredData as DeliveredOrder[] || [])

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      showError('Erro ao carregar dados do painel: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPaymentAndGenerateCommission = async (order: DeliveredOrder) => {
    setSubmitting(true)
    const toastId = showLoading('Confirmando pagamento e gerando comissão...')

    try {
      // 1. Atualizar status do pedido para 'completed' (irá disparar trigger de transação financeira, se existir)
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (orderError) throw new Error('Erro ao atualizar status do pedido: ' + orderError.message)

      // 2. Gerar comissão (10% do total) - compatibilidade com fluxo atual
      const commissionAmount = order.total_amount * 0.10
      const sellerId = order.order_items[0]?.seller_id
      if (!sellerId) throw new Error('Vendedor não encontrado para este pedido.')

      const { error: commissionError } = await supabase
        .from('commissions')
        .insert({
          order_id: order.id,
          seller_id: sellerId,
          amount: commissionAmount,
          status: 'pending'
        })
      
      if (commissionError) throw new Error('Erro ao criar comissão: ' + commissionError.message)

      dismissToast(toastId)
      showSuccess(`Pagamento confirmado e comissão de ${formatPrice(commissionAmount)} gerada para o vendedor!`)
      
      // Recarregar dados
      fetchDashboardData()
      fetchTransactions()

    } catch (error: any) {
      dismissToast(toastId)
      showError(error.message || 'Erro inesperado ao processar confirmação.')
      console.error('Admin confirmation error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const markCommissionAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status: 'paid' })
        .eq('id', commissionId)

      if (error) throw error

      showSuccess('Comissão marcada como paga!')
      fetchDashboardData()
    } catch (error: any) {
      console.error('Error marking commission as paid:', error)
      showError('Erro ao atualizar status da comissão')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const fromDate =
      dateRange === '7d'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : dateRange === '30d'
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : null

    return transactions.filter(tx => {
      const byStatus =
        statusFilter === 'all' ? true : tx.status === statusFilter

      const bySeller =
        sellerQuery.trim().length === 0
          ? true
          : (tx.seller?.store_name || '').toLowerCase().includes(sellerQuery.toLowerCase()) ||
            (tx.seller?.email || '').toLowerCase().includes(sellerQuery.toLowerCase())

      const byDate =
        !fromDate ? true : new Date(tx.created_at) >= fromDate

      return byStatus && bySeller && byDate
    })
  }, [transactions, statusFilter, sellerQuery, dateRange])

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta área.</p>
            <Button onClick={() => navigate('/')}>Voltar para Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Administrador</h1>
          <p className="text-gray-600 mt-2">Gerencie as finanças e visualize as vendas da plataforma.</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comissões Pendentes</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalPending}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comissões Pagas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalPaid}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-3xl font-bold text-blue-600">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmações de Pagamento Pendentes */}
        <Card className="mb-8 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-xl text-blue-800">
              <CheckCircle className="w-6 h-6 mr-2" />
              Confirmações de Pagamento Pendentes ({deliveredOrders.length})
            </CardTitle>
            <Button onClick={() => { fetchDashboardData(); fetchTransactions(); }} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {deliveredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum pedido aguardando confirmação do cliente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveredOrders.map((order) => (
                  <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-blue-900">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-700">
                        Total: <span className="font-semibold">{formatPrice(order.total_amount)}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        Cliente ID: {order.user_id.slice(0, 8)} | Entregue em: {new Date(order.updated_at).toLocaleDateString('pt-MZ')}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleConfirmPaymentAndGenerateCommission(order)}
                      disabled={submitting}
                      className="mt-3 md:mt-0 bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? 'Processando...' : 'Confirmar Pagamento & Gerar Comissão'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comissões Recentes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Histórico de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhuma comissão encontrada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{commission.seller.store_name || commission.seller.email}</p>
                          <p className="text-sm text-gray-600">
                            Pedido #{commission.order.id.slice(0, 8)} • {formatPrice(commission.order.total_amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(commission.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(commission.created_at).toLocaleDateString('pt-MZ')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                      {commission.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => markCommissionAsPaid(commission.id)}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transações Financeiras (automação) */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Transações Financeiras
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(v: 'all' | 'commission_deducted') => setStatusFilter(v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="commission_deducted">Comissão Deduzida</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={(v: 'all' | '7d' | '30d') => setDateRange(v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-[240px]">
                <Input
                  placeholder="Filtrar por vendedor (nome/email)"
                  value={sellerQuery}
                  onChange={(e) => setSellerQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchTransactions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhuma transação encontrada com os filtros atuais.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {tx.seller?.store_name || tx.seller?.email || 'Vendedor'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Pedido #{(tx.order?.id || tx.order_id).slice(0, 8)} • Valor do pedido: {tx.order?.total_amount ? formatPrice(tx.order.total_amount) : '--'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold">{formatPrice(tx.commission_amount)}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString('pt-MZ')}</p>
                        </div>
                      </div>
                    </div>
                    <Badge className="ml-4" variant="secondary">
                      {tx.status === 'commission_deducted' ? 'Comissão Deduzida' : tx.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard