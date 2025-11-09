import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showError } from '../../utils/toast'
import LoadingSpinner from '../LoadingSpinner'

interface CancelledOrder {
  id: string
  total_amount: number
  updated_at: string
  customer_email: string | null
}

const CancelledOrdersCard: React.FC = () => {
  const [orders, setOrders] = useState<CancelledOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCancelledOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          updated_at,
          customer:profiles!user_id ( email )
        `)
        .eq('status', 'cancelled')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) throw error
      
      const formattedData = data.map(order => ({
        id: order.id,
        total_amount: order.total_amount,
        updated_at: order.updated_at,
        customer_email: (order.customer as any)?.email || 'Email não encontrado'
      }))
      
      setOrders(formattedData)
    } catch (error: any) {
      showError('Erro ao buscar pedidos cancelados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCancelledOrders()
  }, [fetchCancelledOrders])

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)
  const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-xl text-red-800">
          <XCircle className="w-6 h-6 mr-2" />
          Últimos Pedidos Cancelados
        </CardTitle>
        <Button onClick={fetchCancelledOrders} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-600 py-8">Nenhum pedido cancelado recentemente.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-red-50">
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-red-900">Pedido #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-700">Cliente: <span className="font-semibold">{order.customer_email}</span></p>
                  <p className="text-sm text-gray-700">Valor: <span className="font-semibold">{formatPrice(order.total_amount)}</span></p>
                  <p className="text-xs text-gray-600">Cancelado em: {formatDate(order.updated_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CancelledOrdersCard