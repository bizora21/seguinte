import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import LoadingSpinner from '../LoadingSpinner'

interface DeliveredOrder {
  id: string
  total_amount: number
  updated_at: string
}

interface DeliveredOrdersCardProps {
  onUpdate: () => void
}

const DeliveredOrdersCard: React.FC<DeliveredOrdersCardProps> = ({ onUpdate }) => {
  const [orders, setOrders] = useState<DeliveredOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, updated_at')
        .eq('status', 'delivered')
        .order('updated_at', { ascending: true })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      showError('Erro ao buscar pedidos entregues: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleConfirm = async (orderId: string) => {
    setSubmittingId(orderId)
    const toastId = showLoading('Confirmando e gerando comissão...')
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId)

      if (error) throw error
      dismissToast(toastId)
      showSuccess('Pagamento confirmado! A comissão será registrada.')
      onUpdate() // Notifica o painel principal para atualizar as estatísticas
      fetchOrders() // Recarrega a lista local
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao confirmar: ' + error.message)
    } finally {
      setSubmittingId(null)
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-blue-800">
          <CheckCircle className="w-6 h-6 mr-2" />
          Pedidos Entregues (Aguardando Confirmação)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-600 py-8">Nenhum pedido aguardando confirmação.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-blue-50">
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-blue-900">Pedido #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-700">Total: <span className="font-semibold">{formatPrice(order.total_amount)}</span></p>
                  <p className="text-xs text-gray-600">Entregue em: {new Date(order.updated_at).toLocaleDateString('pt-MZ')}</p>
                </div>
                <Button
                  onClick={() => handleConfirm(order.id)}
                  disabled={!!submittingId}
                  className="mt-3 sm:mt-0 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  {submittingId === order.id ? 'Processando...' : 'Confirmar Recebimento (Admin)'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DeliveredOrdersCard