import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { XCircle, RefreshCw, AlertOctagon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showError, showSuccess } from '../../utils/toast'
import LoadingSpinner from '../LoadingSpinner'

interface CancelledOrder {
  id: string
  total_amount: number
  updated_at: string
  customer_email: string | null
  customer_name?: string // Adicionado
}

const CancelledOrdersCard: React.FC = () => {
  const [orders, setOrders] = useState<CancelledOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCancelledOrders = useCallback(async () => {
    setLoading(true)
    try {
      // Usando query direta para pegar os dados mais recentes
      const { data, error } = await supabase
        .from('orders')
        .select(`
            id, 
            total_amount, 
            updated_at, 
            customer_name,
            user_id(email) // Corrigido: Usando a coluna FK como nome da relação para perfis
        `)
        .eq('status', 'cancelled')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) throw error
      
      const formattedData = data.map((o: any) => ({
          id: o.id,
          total_amount: o.total_amount,
          updated_at: o.updated_at,
          customer_email: o.user_id?.email || 'N/A', // Ajustado para user_id
          customer_name: o.customer_name
      }))

      setOrders(formattedData)
    } catch (error: any) {
      console.error('Erro admin cancelados:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCancelledOrders()

    // --- REALTIME: Escutar novos cancelamentos ---
    const channel = supabase
      .channel('admin-cancelled-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.cancelled'
        },
        (payload) => {
          // Quando um pedido é cancelado, atualizamos a lista
          showSuccess(`Novo cancelamento detectado: Pedido #${payload.new.id.slice(0,8)}`)
          fetchCancelledOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCancelledOrders])

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)
  const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-red-50 rounded-t-xl border-b border-red-100">
        <CardTitle className="flex items-center text-xl text-red-800">
          <AlertOctagon className="w-6 h-6 mr-2" />
          Cancelamentos Recentes (Tempo Real)
        </CardTitle>
        <Button onClick={fetchCancelledOrders} variant="ghost" size="sm" className="text-red-700 hover:bg-red-100">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <XCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum cancelamento recente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col p-3 border border-red-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-red-900 text-sm">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Cliente: <span className="font-medium text-gray-900">{order.customer_name || order.customer_email}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-red-600">{formatPrice(order.total_amount)}</span>
                        <span className="text-[10px] text-gray-400">{formatDate(order.updated_at)}</span>
                    </div>
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