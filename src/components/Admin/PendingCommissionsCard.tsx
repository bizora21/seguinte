import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { DollarSign, Store, RefreshCw, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showError } from '../../utils/toast'
import LoadingSpinner from '../LoadingSpinner'

interface Commission {
  id: string
  order_id: string
  amount: number
  created_at: string
  seller_id: string
  order: {
    id: string
  }
}

interface SellerSummary {
  seller_id: string
  store_name: string
  email: string
  total_owed: number
  commission_count: number
  last_commission_date: string
}

const PendingCommissionsCard: React.FC = () => {
  const [sellerSummaries, setSellerSummaries] = useState<SellerSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPendingCommissions = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Buscar todas as comissões pendentes e os detalhes do vendedor
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select(`
          id, amount, created_at, seller_id,
          seller:profiles!inner(store_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (commissionsError) throw commissionsError

      // 2. Agrupar por vendedor
      const summariesMap = new Map<string, SellerSummary>()

      for (const commission of commissionsData as any[]) {
        const sellerId = commission.seller_id
        const amount = commission.amount
        const storeName = commission.seller?.store_name || commission.seller?.email.split('@')[0] || 'Vendedor Desconhecido'
        const email = commission.seller?.email || 'N/A'
        const createdAt = commission.created_at

        if (!summariesMap.has(sellerId)) {
          summariesMap.set(sellerId, {
            seller_id: sellerId,
            store_name: storeName,
            email: email,
            total_owed: 0,
            commission_count: 0,
            last_commission_date: createdAt,
          })
        }

        const summary = summariesMap.get(sellerId)!
        summary.total_owed += amount
        summary.commission_count += 1
        if (new Date(createdAt) > new Date(summary.last_commission_date)) {
          summary.last_commission_date = createdAt
        }
      }

      // 3. Converter o mapa para um array e ordenar pelo valor devido
      const sortedSummaries = Array.from(summariesMap.values()).sort((a, b) => b.total_owed - a.total_owed)
      
      setSellerSummaries(sortedSummaries)

    } catch (error: any) {
      console.error('Error fetching pending commissions:', error)
      showError('Erro ao carregar comissões pendentes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingCommissions()
  }, [fetchPendingCommissions])

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)
  const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'short' }).format(new Date(dateString))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-xl text-orange-600">
          <DollarSign className="w-6 h-6 mr-2" />
          Comissões Pendentes por Vendedor
        </CardTitle>
        <Button onClick={fetchPendingCommissions} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : sellerSummaries.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma comissão pendente no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sellerSummaries.map((summary) => (
              <div key={summary.seller_id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center font-medium text-orange-900 truncate">
                    <Store className="w-4 h-4 mr-2" />
                    {summary.store_name}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center space-x-2">
                    <Clock className="w-3 h-3" />
                    <span>Última: {formatDate(summary.last_commission_date)}</span>
                    <span>• {summary.commission_count} item(s)</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-orange-600">{formatPrice(summary.total_owed)}</p>
                  <p className="text-xs text-gray-500">Devido à LojaRápida</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PendingCommissionsCard