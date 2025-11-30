import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { 
  ShoppingCart, 
  XCircle, 
  CheckCircle, 
  DollarSign, 
  AlertTriangle, 
  Info, 
  Clock,
  Activity
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminNotification } from '../../utils/admin'

const AdminActivityFeed = () => {
  const [activities, setActivities] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchActivities()
    const subscription = setupRealtime()
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) // Pegar os últimos 50 eventos

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel('admin-feed-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const newEvent = payload.new as AdminNotification
          setActivities(prev => [newEvent, ...prev])
        }
      )
      .subscribe()
    
    return channel
  }

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(dateString))
  }

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'new_order':
        return {
          icon: <ShoppingCart className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          title: 'Novo Pedido'
        }
      case 'order_cancelled':
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          bg: 'bg-red-50',
          border: 'border-red-100',
          title: 'Cancelamento'
        }
      case 'delivery_confirmed':
        return {
          icon: <DollarSign className="w-5 h-5 text-green-600" />,
          bg: 'bg-green-50',
          border: 'border-green-100',
          title: 'Entrega & Comissão'
        }
      case 'payment_proof_submitted':
        return {
          icon: <Info className="w-5 h-5 text-orange-600" />,
          bg: 'bg-orange-50',
          border: 'border-orange-100',
          title: 'Comprovante Enviado'
        }
      case 'payment_approved':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50',
          border: 'border-emerald-100',
          title: 'Pagamento Aprovado'
        }
      default:
        return {
          icon: <Activity className="w-5 h-5 text-gray-600" />,
          bg: 'bg-gray-50',
          border: 'border-gray-100',
          title: 'Evento do Sistema'
        }
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          Feed de Atividades Global (Tempo Real)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[500px] p-4">
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Carregando histórico...</p>
            ) : activities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma atividade registrada recentemente.</p>
            ) : (
              activities.map((activity) => {
                const style = getEventStyle(activity.type)
                return (
                  <div 
                    key={activity.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${style.bg} ${style.border} transition-all hover:shadow-sm`}
                  >
                    <div className="mt-1 bg-white p-1.5 rounded-full shadow-sm">
                      {style.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900">
                          {style.title}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(activity.created_at)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-snug">
                        {activity.message}
                      </p>
                      {/* Indicador visual de transação financeira automática */}
                      {activity.type === 'delivery_confirmed' && (
                        <div className="mt-2 flex items-center">
                          <Badge variant="outline" className="bg-white text-green-700 border-green-200 text-[10px]">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Comissão Deduzida Automaticamente
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default AdminActivityFeed