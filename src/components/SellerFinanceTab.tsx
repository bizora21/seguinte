import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DollarSign, AlertCircle, ExternalLink, TrendingUp, Phone, CheckCheck } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface Commission {
  id: string
  order_id: string
  amount: number
  status: 'pending' | 'paid'
  created_at: string
  payment_method?: string | null
  admin_payment_reference?: string | null
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
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Número de telefone para pagamento M-Pesa/eMola
  const PAYMENT_PHONE = '846843135'

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

  const handleSendPaymentProof = async () => {
    if (!paymentRef.trim() || !paymentMethod) {
      showError('Por favor, preencha o ID da Transação e o Método de Pagamento.')
      return
    }

    if (totalOwed <= 0) {
      showError('Você não tem comissões pendentes para pagar.')
      return
    }

    setSubmittingPayment(true)
    const toastId = showLoading('Enviando comprovante...')

    try {
      // Atualizar todas as comissões pendentes com o comprovante
      // Nota: Em um sistema real, isso seria mais complexo (pagamento por fatura),
      // mas para este MVP, atualizamos todas as pendentes.
      const pendingIds = commissions.filter(c => c.status === 'pending').map(c => c.id)

      const { error } = await supabase
        .from('commissions')
        .update({ 
          payment_method: paymentMethod,
          admin_payment_reference: paymentRef.trim()
        })
        .in('id', pendingIds)
        .eq('seller_id', user!.id)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Comprovante enviado! O administrador irá verificar e marcar como pago.')
      
      // Limpar formulário e recarregar
      setPaymentRef('')
      setPaymentMethod('')
      fetchCommissions()

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao enviar comprovante: ' + error.message)
      console.error('Payment proof error:', error)
    } finally {
      setSubmittingPayment(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
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

      {/* Pagamento de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Pagar Comissões Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-2">
                Total a Pagar: <span className="text-lg font-bold">{formatPrice(totalOwed)}</span>
              </p>
              <p className="text-sm text-red-700">
                Efetue o pagamento para o número: <strong className="text-red-900">{PAYMENT_PHONE}</strong> (M-Pesa, eMola ou Conta Bancária).
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendPaymentProof() }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pagamento *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={submittingPayment || totalOwed <= 0}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="eMola">eMola</SelectItem>
                      <SelectItem value="Transferencia">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentRef">ID da Transação / Comprovante *</Label>
                  <Input
                    id="paymentRef"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Ex: ID da transação M-Pesa"
                    disabled={submittingPayment || totalOwed <= 0}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={submittingPayment || totalOwed <= 0 || !paymentRef || !paymentMethod}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {submittingPayment ? 'Enviando...' : 'Enviar Comprovante'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Histórico de Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Você ainda não tem comissões registradas.</p>
              <p className="text-sm text-gray-500 mt-2">As comissões são geradas quando seus pedidos são confirmados pelo administrador.</p>
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
                    {(commission.payment_method || commission.admin_payment_reference) && (
                      <p className="text-xs text-blue-600 mt-1">
                        Comprovante: {commission.payment_method} ({commission.admin_payment_reference})
                      </p>
                    )}
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
    </div>
  )
}

export default SellerFinanceTab