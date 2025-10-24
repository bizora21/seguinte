import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { OrderWithItems } from '../types/order'
import { useEffect } from 'react'

const fetchOrderDetails = async (orderId: string, userId: string): Promise<OrderWithItems> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (
          name,
          image_url
        )
      )
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Pedido não encontrado')
  
  // Garantir que o formato OrderWithItems seja respeitado
  return data as OrderWithItems
}

export const useOrderDetails = (orderId: string | undefined, userId: string | undefined) => {
  const queryClient = useQueryClient()
  const queryKey = ['order', orderId]

  const { data, isLoading, error } = useQuery<OrderWithItems, Error>({
    queryKey: queryKey,
    queryFn: () => {
      if (!orderId || !userId) {
        throw new Error('ID do pedido ou ID do usuário ausente')
      }
      return fetchOrderDetails(orderId, userId)
    },
    enabled: !!orderId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  // Configuração do Realtime Subscription
  useEffect(() => {
    if (!orderId || !userId) return

    console.log(`Realtime: Setting up subscription for order ${orderId}`)

    const channel = supabase
      .channel(`order_status_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Realtime: Order status updated via subscription:', payload)
          
          // Invalida a query para forçar o React Query a buscar os dados atualizados
          // ou atualiza o cache diretamente se a estrutura for simples
          queryClient.invalidateQueries({ queryKey: queryKey })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: Subscription active for order ${orderId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime: Subscription error for order', orderId)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, userId, queryClient])

  return {
    order: data,
    isLoading,
    error,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKey })
  }
}