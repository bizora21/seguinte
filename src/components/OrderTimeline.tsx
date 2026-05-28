import React from 'react'
import { Check, X } from 'lucide-react'

type OrderStatus = 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'completed' | 'cancelled'

interface OrderTimelineProps {
  status: OrderStatus
}

const STEPS = [
  { key: 'pending', label: 'Pendente' },
  { key: 'preparing', label: 'Em Preparação' },
  { key: 'in_transit', label: 'A Caminho' },
  { key: 'delivered', label: 'Entregue' },
] as const

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  preparing: 1,
  in_transit: 2,
  delivered: 3,
  completed: 3, // estado terminal — mesmo passo visual que delivered
  cancelled: -1,
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
  // Cancelado tem visualização especial — sem timeline
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center flex-shrink-0">
          <X className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="font-semibold text-red-900">Pedido cancelado</p>
          <p className="text-sm text-red-700">Este pedido foi cancelado e não está em rastreamento.</p>
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_INDEX[status]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex
          const isActive = i === currentIndex

          return (
            <React.Fragment key={step.key}>
              {/* Step (círculo + label) */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`
                    w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all
                    ${isDone ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${isActive ? 'bg-green-500 border-green-500 text-white ring-4 ring-green-200' : ''}
                    ${!isDone && !isActive ? 'bg-white border-gray-300 text-gray-400' : ''}
                  `}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <span className="text-xs md:text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-[10px] md:text-xs font-medium text-center w-16 md:w-24 leading-tight
                    ${isActive ? 'text-green-700 font-bold' : isDone ? 'text-gray-700' : 'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Linha conectora (entre steps) */}
              {i < STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mt-4 md:mt-5 transition-colors duration-500
                    ${i < currentIndex ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
