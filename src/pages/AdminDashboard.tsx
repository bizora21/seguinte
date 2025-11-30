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
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Painel do Administrador</h1>
            <p className="text-gray-600 mt-1">Bem-vindo(a), {user?.email}.</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button onClick={fetchDashboardData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => navigate('/dashboard/admin/marketing')} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Marketing
            </Button>
            <Button onClick={() => navigate('/dashboard/admin/intelligence')} className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg">
              <BrainCircuit className="w-4 h-4 mr-2" />
              NEXUS AI
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total (Comissões)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Total de comissões pagas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPaid}</div>
              <p className="text-xs text-muted-foreground">Total de transações concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">Aguardando pagamento do vendedor</p>
            </CardContent>
          </Card>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal (Ações e Feed) */}
          <div className="lg:col-span-2 space-y-8">
            <AdminPaymentManagementTab />
            
            {/* Feed Global em Destaque */}
            <AdminActivityFeed />
            
            <DeliveredOrdersCard onUpdate={fetchDashboardData} />
          </div>

          {/* Coluna Lateral (Pendências Específicas) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Cancelamentos no topo da lateral para visibilidade */}
            <CancelledOrdersCard />
            <PendingCommissionsCard />
            <CommissionsHistoryCard lastUpdated={lastUpdated} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard