import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface UseChatOptions {
  productId: string
  clientId: string
  sellerId: string
}

interface UseChatReturn {
  chatId: string | null
  loading: boolean
  error: string | null
  createOrGetChat: () => Promise<string | null>
}

export const useChat = ({ productId, clientId, sellerId }: UseChatOptions): UseChatReturn => {
  const [chatId, setChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar chat existente ou criar um novo
  const createOrGetChat = async (): Promise<string | null> => {
    if (!productId || !clientId || !sellerId) {
      setError('Parâmetros incompletos para criar chat')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Primeiro, tentar encontrar um chat existente
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .eq('product_id', productId)
        .eq('client_id', clientId)
        .eq('seller_id', sellerId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Erro real (não é "not found")
        throw fetchError
      }

      if (existingChat) {
        // Chat já existe
        setChatId(existingChat.id)
        return existingChat.id
      }

      // Criar novo chat
      const { data: newChat, error: insertError } = await supabase
        .from('chats')
        .insert({
          product_id: productId,
          client_id: clientId,
          seller_id: sellerId
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      setChatId(newChat.id)
      return newChat.id

    } catch (error: any) {
      console.error('Error in createOrGetChat:', error)
      setError(error.message || 'Erro ao criar/buscar chat')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Auto-buscar chat quando os parâmetros mudarem
  useEffect(() => {
    if (productId && clientId && sellerId) {
      createOrGetChat()
    }
  }, [productId, clientId, sellerId])

  return {
    chatId,
    loading,
    error,
    createOrGetChat
  }
}