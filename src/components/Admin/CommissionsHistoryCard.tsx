import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'

interface Commission {
  id: string
  amount: number
  created_at: string
  seller: { store_name: string, email: string }
}

interface CommissionsHistoryCardProps {
  lastUpdated: Date
}

const CommissionsHistoryCard: React.FC<CommissionsHistoryCardProps> = ({ lastUpdated }) => {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('id, amount, created_at, seller:profiles!inner(store_name, email)')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setCommissions(data as unknown as Commission[] || [])
    } catch (error) {
      console.error('Error fetching paid commissions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions, lastUpdated])

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Clock className="w-6 h-6 mr-2" />
          Histórico de Comissões Pagas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : commissions.length === 0 ? (
          <p className="text-center text-gray-600 py-8">Nenhuma comissão paga ainda.</p>
        ) : (
          <div className="space-y-4">
            {commissions.map((commission) => (
              <div key={commission.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{commission.seller.store_name || commission.seller.email}</p>
                  <p className="text-xs text-gray-500">{new Date(commission.created_at).toLocaleDateString('pt-MZ')}</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {formatPrice(commission.amount)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CommissionsHistoryCard