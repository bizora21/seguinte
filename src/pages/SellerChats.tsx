import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChatWithDetails } from '../types/chat'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, MessageCircle, Store, User, Clock } from 'lucide-react'

const SellerChats = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState<ChatWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      fetchChats()
      setupRealtimeSubscription()
    }

    return () => {
      supabase.channel('seller-chats').unsubscribe()
    }
  }, [user])

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          product:products (
            name
          ),
          client:auth.users!chats_client_id_fkey (
            email
          ),
          seller:auth.users!chats_seller_id_fkey (
            email
          )
        `)
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching chats:', error)
      } else {
        // Buscar contagem de mensagens para cada chat
        const chatsWithCounts = await Promise.all(
          (data || []).map(async (chat) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
            
            return {
              ...chat,
              _count: { messages: count || 0 }
            }
          })
        )
        
        setChats(chatsWithCounts)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('seller-chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `seller_id=eq.${user!.id}`
        },
        () => {
          console.log('New chat received')
          fetchChats()
        }
      )
      .subscribe()

    console.log('Realtime subscription set up for seller chats')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(date)
  }

  if (user?.profile?.role !== 'vendedor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Meus Chats</h1>
          <p className="text-gray-600 mt-2">Converse com seus clientes sobre os produtos</p>
        </div>

        {chats.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma conversa ainda
              </h2>
              <p className="text-gray-600">
                Os clientes ainda não iniciaram conversas com você.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <Card 
                key={chat.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg flex items-center">
                          {chat.client.email.split('@')[0]}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Cliente
                          </Badge>
                        </h3>
                        <p className="text-sm text-gray-600">{chat.client.email}</p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Store className="w-3 h-3 mr-1" />
                          Sobre: {chat.product.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(chat.created_at)}
                      </div>
                      <Badge variant="outline">
                        {chat._count?.messages || 0} mensagens
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerChats