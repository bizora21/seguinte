import { Order, OrderStatusOption } from '../types/order'

export const ORDER_STATUS_OPTIONS: OrderStatusOption[] = [
  {
    value: 'pending',
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳'
  },
  {
    value: 'preparing',
    label: 'Em Preparação',
    color: 'bg-blue-100 text-blue-800',
    icon: '👨‍🍳'
  },
  {
    value: 'in_transit',
    label: 'A Caminho',
    color: 'bg-purple-100 text-purple-800',
    icon: '🚚'
  },
  {
    value: 'delivered',
    label: 'Entregue',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  {
    value: 'cancelled',
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  }
]

export const getStatusInfo = (status: Order['status']) => {
  return ORDER_STATUS_OPTIONS.find(option => option.value === status) || ORDER_STATUS_OPTIONS[0]
}

export const getNextStatuses = (currentStatus: Order['status']) => {
  const statusFlow: Record<Order['status'], Order['status'][]> = {
    'pending': ['preparing', 'cancelled'],
    'preparing': ['in_transit', 'cancelled'],
    'in_transit': ['delivered'],
    'delivered': [],
    'cancelled': []
  }
  
  return statusFlow[currentStatus].map(status => getStatusInfo(status))
}