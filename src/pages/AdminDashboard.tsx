import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, DollarSign, TrendingUp, Users, Package, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { showSuccess, showError } from '../utils/toast'

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

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL) {
      navigate('/')
      return
    }
    fetchCommissions()
  }, [user, navigate])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
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

      if (error) throw error

      setCommissions(data || [])
      
      // Calcular estatísticas
      const pending = data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0
      const paid = data?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0
      
      setStats({
        totalPending: data?.filter(c => c.status === 'pending').length || 0,
        totalPaid: data?.filter(c => c.status === 'paid').length || 0,
        totalRevenue: paid
      })

    } catch (error: any) {
      console.error('Error fetching commissions:', error)
      showError('Erro ao carregar comissões')
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status: 'paid' })
        .eq('id', commissionId)

      if (error) throw error

      showSuccess('Comissão marcada como paga!')
      fetchCommissions() // Recarregar dados
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

        {/* Comissões Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Comissões Recentes
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
                          onClick={() => markAsPaid(commission.id)}
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
      </div>
    </div>
  )
}

export default AdminDashboard