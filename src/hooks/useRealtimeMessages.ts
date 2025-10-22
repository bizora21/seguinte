import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { MessageWithSender } from '../types/chat'

interface UseRealtimeMessagesOptions {
  chatId: string | null
}

interface UseRealtimeMessagesReturn {
  messages: MessageWithSender[]
  loading: boolean
  error: string | null
  sendMessage: (content: string, senderId: string) => Promise<boolean>
  refreshMessages: () => Promise<void>
}

export const useRealtimeMessages = ({ chatId }: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn => {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<any>(null)

  // Buscar mensagens existentes
  const fetchMessages = async () => {
    if (!chatId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            email,
            store_name
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      setMessages(data || [])

    } catch (error: any) {
      console.error('Error fetching messages:', error)
      setError(error.message || 'Erro ao buscar mensagens')
    } finally {
      setLoading(false)
    }
  }

  // Enviar nova mensagem
  const sendMessage = async (content: string, senderId: string): Promise<boolean> => {
    if (!chatId || !content.trim() || !senderId) {
      return false
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content: content.trim()
        })

      if (error) {
        throw error
      }

      return true

    } catch (error: any) {
      console.error('Error sending message:', error)
      setError(error.message || 'Erro ao enviar mensagem')
      return false
    }
  }

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!chatId) return

    // Buscar mensagens iniciais
    fetchMessages()

    // Configurar subscription
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          // Buscar informações completas do remetente
          const { data: senderData } = await supabase
            .from('profiles')
            .select('email, store_name')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: MessageWithSender = {
            id: payload.new.id,
            chat_id: payload.new.chat_id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            sender: senderData || { email: 'Desconhecido' }
          }

          // Adicionar mensagem à lista
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime subscription active for chat ${chatId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error')
          setError('Erro na conexão em tempo real')
        }
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [chatId])

  return {
    messages,
    loading,
    error,
    sendMessage,
    refreshMessages: fetchMessages
  }
}