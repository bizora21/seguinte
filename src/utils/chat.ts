import { supabase } from '../lib/supabase'

// Função para buscar todos os chats de um usuário
export const getUserChats = async (userId: string, role: 'client' | 'seller') => {
  try {
    const column = role === 'client' ? 'client_id' : 'seller_id'
    
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        product:products ( name, image_url ),
        client:profiles!chats_client_id_fkey ( email, store_name ),
        seller:profiles!chats_seller_id_fkey ( email, store_name ),
        messages:messages ( count )
      `)
      .eq(column, userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Adicionar contagem de mensagens
    const chatsWithCounts = (data || []).map(chat => ({
      ...chat,
      _count: {
        messages: chat.messages?.[0]?.count || 0
      }
    }))

    return { data: chatsWithCounts, error: null }

  } catch (error: any) {
    console.error('Error fetching user chats:', error)
    return { data: null, error: error.message }
  }
}

// Função para buscar detalhes de um chat específico
export const getChatDetails = async (chatId: string) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        product:products ( name, image_url ),
        client:profiles!chats_client_id_fkey ( email, store_name ),
        seller:profiles!chats_seller_id_fkey ( email, store_name )
      `)
      .eq('id', chatId)
      .single()

    if (error) throw error

    return { data, error: null }

  } catch (error: any) {
    console.error('Error fetching chat details:', error)
    return { data: null, error: error.message }
  }
}

// Função para marcar mensagens como lidas (futuro implementação)
export const markMessagesAsRead = async (chatId: string, userId: string) => {
  // Implementação futura para status de leitura
  console.log(`Marking messages as read for chat ${chatId} by user ${userId}`)
}