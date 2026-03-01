import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowLeft, DollarSign, TrendingUp, Users, Package, RefreshCw, Zap, BrainCircuit } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { showError } from '../utils/toast'
import DeliveredOrdersCard from '../components/Admin/DeliveredOrdersCard'
import CommissionsHistoryCard from '../components/Admin/CommissionsHistoryCard'
import AdminPaymentManagementTab from '../components/AdminPaymentManagementTab'
import CancelledOrdersCard from '../components/Admin/CancelledOrdersCard'
import PendingCommissionsCard from '../components/Admin/PendingCommissionsCard'
import AdminActivityFeed from '../components/Admin/AdminActivityFeed' // NOVO IMPORT

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const { data: commissionData, error: commissionError } = await supabase
        .from('commissions')
        .select('amount, status')

      if (commissionError) throw commissionError

      const pending = commissionData?.filter(c => c.status === 'pending').length || 0
      const paid = commissionData?.filter(c => c.status === 'paid').length || 0
      const revenue = commissionData?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0
      
      setStats({
        totalPending: pending,
        totalPaid: paid,
        totalRevenue: revenue
      })
      setLastUpdated(new Date())
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      showError('Erro ao carregar dados do painel: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || !user) return
    fetchDashboardData()
  }, [user, authLoading])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <Button variant="ghost" onClick={() => navigate('/')} className="mb-3 -ml-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Site
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-[#0A2540] to-[#1a3a52] bg-clip-text text-transparent">
                Painel do Administrador
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo(a), <span className="font-semibold text-[#0A2540]">{user?.email}</span>
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                className="hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={() => navigate('/dashboard/admin/marketing')}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Zap className="w-4 h-4 mr-2" />
                Marketing
              </Button>
              <Button
                onClick={() => navigate('/dashboard/admin/intelligence')}
                className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <BrainCircuit className="w-4 h-4 mr-2" />
                NEXUS AI
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Receita Total</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-sm text-green-700 mt-1">Total de comissões pagas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Comissões Pagas</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalPaid}</div>
              <p className="text-sm text-blue-700 mt-1">Transações concluídas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Comissões Pendentes</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.totalPending}</div>
              <p className="text-sm text-orange-700 mt-1">Aguardando pagamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal (Ações e Feed) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Gestão de Pagamentos</h2>
                <div className="text-sm text-gray-500">
                  Última atualização: {lastUpdated.toLocaleTimeString('pt-MZ')}
                </div>
              </div>
              <AdminPaymentManagementTab />
            </div>

            {/* Feed Global em Destaque */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
              <AdminActivityFeed />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Encomendas Entregues</h2>
              <DeliveredOrdersCard onUpdate={fetchDashboardData} />
            </div>
          </div>

          {/* Coluna Lateral (Pendências Específicas) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Cancelamentos no topo da lateral para visibilidade */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                Cancelamentos
              </h2>
              <CancelledOrdersCard />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
              <h2 className="text-lg font-semibold text-orange-900 mb-4">Comissões Pendentes</h2>
              <PendingCommissionsCard />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h2>
              <CommissionsHistoryCard lastUpdated={lastUpdated} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard