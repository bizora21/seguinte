import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DollarSign, AlertCircle, ExternalLink, TrendingUp } from 'lucide-react'
import { showSuccess, showError } from '../utils/toast'

interface Commission {
  id: string
  order_id: string
  amount: number
  status: 'pending' | 'paid'
  created_at: string
  order: {
    id: string
    total_amount: number
  }
}

const SellerFinanceTab = () => {
  const { user } = useAuth()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [totalOwed, setTotalOwed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCommissions()
    }
  }, [user])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          order:orders (
            id,
            total_amount
          )
        `)
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCommissions(data || [])
      
      // Calcular saldo devedor
      const owed = data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0
      setTotalOwed(owed)

    } catch (error: any) {
      console.error('Error fetching commissions:', error)
      showError('Erro ao carregar dados financeiros')
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

  const handlePaymentInfo = () => {
    showSuccess('Entre em contato com o suporte para instruções de pagamento.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">Saldo Devedor</p>
              <p className="text-3xl font-bold text-orange-600">{formatPrice(totalOwed)}</p>
              <p className="text-xs text-orange-600 mt-2">Comissões pendentes de pagamento</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">Total Recebido</p>
              <p className="text-3xl font-bold text-green-600">
                {formatPrice(commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0))}
              </p>
              <p className="text-xs text-green-600 mt-2">Comissões já pagas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Histórico de Comissões
            </div>
            {totalOwed > 0 && (
              <Button onClick={handlePaymentInfo} size="sm">
                <DollarSign className="w-4 h-4 mr-2" />
                Pagar Agora
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Você ainda não tem comissões registradas.</p>
              <p className="text-sm text-gray-500 mt-2">As comissões são geradas quando seus pedidos são entregues.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{formatPrice(commission.amount)}</p>
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Pedido #{commission.order.id.slice(0, 8)} • Total: {formatPrice(commission.order.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Gerado em {new Date(commission.created_at).toLocaleDateString('pt-MZ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Como Pagar as Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Para pagar suas comissões, entre em contato com nossa equipe de suporte. Aceitamos:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>M-Pesa</li>
              <li>eMola</li>
              <li>Transferência Bancária</li>
            </ul>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Contato para Pagamentos:</p>
              <p className="text-sm text-blue-700">Email: financeiro@lojarapida.com</p>
              <p className="text-sm text-blue-700">WhatsApp: +258 86 318 1415</p>
            </div>
            <Button className="w-full" onClick={() => window.location.href = 'mailto:financeiro@lojarapida.com'}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Enviar Email para Pagamento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SellerFinanceTab