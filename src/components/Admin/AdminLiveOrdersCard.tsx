import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import { Circle, Package, Store, User, Clock, ExternalLink } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface LiveOrder {
  orderId: string
  customerName: string
  amount: number
  productName: string
  sellerName: string
  status: string
  createdAt: string
}

function formatRelative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: '2-digit' }).format(new Date(iso))
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  a_caminho: { label: 'A caminho', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  entregue:  { label: 'Entregue', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
}

const AdminLiveOrdersCard = () => {
  const navigate = useNavigate()
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const isFirstLoad = useRef(true)

  const enrichOrder = async (orderId: string, createdAt: string, status: string): Promise<LiveOrder | null> => {
    const [{ data: order }, { data: items }] = await Promise.all([
      supabase.from('orders').select('customer_name, total_amount').eq('id', orderId).single(),
      supabase
        .from('order_items')
        .select('product_id, seller_id, products(name), seller:profiles!order_items_seller_id_fkey(store_name)')
        .eq('order_id', orderId)
        .limit(1)
        .single(),
    ])

    if (!order) return null

    const item = items as any
    return {
      orderId,
      customerName: order.customer_name || 'Cliente',
      amount: order.total_amount,
      productName: item?.products?.name || 'Produto',
      sellerName: item?.seller?.store_name || 'Vendedor',
      status,
      createdAt,
    }
  }

  const fetchRecentOrders = async () => {
    setLoading(true)
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(8)

      if (!orders) return

      const enriched = await Promise.all(
        orders.map(o => enrichOrder(o.id, o.created_at, o.status))
      )
      setLiveOrders(enriched.filter(Boolean) as LiveOrder[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentOrders()

    const channel = supabase
      .channel('admin-live-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const newOrder = payload.new as any
          const enriched = await enrichOrder(newOrder.id, newOrder.created_at, newOrder.status)
          if (!enriched) return

          setLiveOrders(prev => [enriched, ...prev].slice(0, 8))
          if (!isFirstLoad.current) {
            setNewCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as any
          setLiveOrders(prev =>
            prev.map(o => o.orderId === updated.id ? { ...o, status: updated.status } : o)
          )
        }
      )
      .subscribe()

    isFirstLoad.current = false

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-gray-700">Encomendas em Tempo Real</span>
          {newCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs h-5 px-1.5" onClick={() => setNewCount(0)}>
              {newCount} nova{newCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRecentOrders} className="text-xs text-gray-500">
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" />
        </div>
      ) : liveOrders.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">Sem encomendas recentes.</p>
      ) : (
        <div className="space-y-0">
          {liveOrders.map((order, idx) => {
            const statusInfo = STATUS_LABEL[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
            const isNew = idx === 0 && newCount > 0

            return (
              <div key={order.orderId} className="relative flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 mt-1.5 flex-shrink-0 ${isNew ? 'bg-green-500 border-green-400 animate-pulse' : 'bg-gray-300 border-gray-200'}`} />
                  {idx < liveOrders.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1" style={{ minHeight: 32 }} />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-4 ${isNew ? 'rounded-xl border border-green-200 bg-green-50 p-3 mb-2' : ''}`}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5 min-w-0">
                      {isNew && <p className="text-xs font-bold text-green-700 mb-1">🔔 Nova encomenda!</p>}
                      <div className="flex items-center gap-1.5 text-sm text-gray-900">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{order.productName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Store className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{order.sellerName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs font-bold text-green-700">
                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 0 }).format(order.amount)}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelative(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/meus-pedidos')}
                    className="mt-1.5 text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Ver encomenda #{order.orderId.slice(0, 8)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminLiveOrdersCard
