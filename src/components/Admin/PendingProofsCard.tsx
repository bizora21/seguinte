import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Receipt } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import LoadingSpinner from '../LoadingSpinner'

interface Commission {
  id: string
  amount: number
  seller: { store_name: string, email: string }
  payment_method?: string | null
  admin_payment_reference?: string | null
}

interface PendingProofsCardProps {
  onUpdate: () => void
}

const PendingProofsCard: React.FC<PendingProofsCardProps> = ({ onUpdate }) => {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('id, amount, seller:profiles!inner(store_name, email), payment_method, admin_payment_reference')
        .eq('status', 'pending')
        .not('admin_payment_reference', 'is', null)

      if (error) throw error
      setCommissions(data as unknown as Commission[] || [])
    } catch (error: any) {
      showError('Erro ao buscar comprovantes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  const handleMarkAsPaid = async (commissionId: string) => {
    setSubmittingId(commissionId)
    const toastId = showLoading('Marcando como paga...')
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status: 'paid' })
        .eq('id', commissionId)

      if (error) throw error
      dismissToast(toastId)
      showSuccess('Comissão marcada como paga!')
      onUpdate()
      fetchCommissions()
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao atualizar comissão: ' + error.message)
    } finally {
      setSubmittingId(null)
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-orange-800">
          <Receipt className="w-6 h-6 mr-2" />
          Comprovantes de Pagamento Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : commissions.length === 0 ? (
          <p className="text-center text-gray-600 py-8">Nenhum comprovante aguardando verificação.</p>
        ) : (
          <div className="space-y-4">
            {commissions.map((commission) => (
              <div key={commission.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-orange-50">
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="font-medium text-orange-900 truncate">Vendedor: {commission.seller.store_name || commission.seller.email}</p>
                  <p className="text-sm text-gray-700">Valor: <span className="font-semibold">{formatPrice(commission.amount)}</span></p>
                  <p className="text-xs text-gray-600">Método: {commission.payment_method} | Ref: {commission.admin_payment_reference}</p>
                </div>
                <Button
                  onClick={() => handleMarkAsPaid(commission.id)}
                  disabled={!!submittingId}
                  className="mt-3 sm:mt-0 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  {submittingId === commission.id ? 'Confirmando...' : 'Confirmar Pagamento'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PendingProofsCard