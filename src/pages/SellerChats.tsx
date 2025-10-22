import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChatWithDetails } from '../types/chat'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, MessageCircle, Store, User, Clock } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const SellerChats = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState<ChatWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      fetchChats()
    }
  }, [user])

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          product:products ( name ),
          client:profiles!chats_client_id_fkey ( email, store_name ),
          seller:profiles!chats_seller_id_fkey ( email, store_name )
        `)
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const chatsWithCounts = await Promise.all(
        (data || []).map(async (chat) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
          return { ...chat, _count: { messages: count || 0 } }
        })
      )
      setChats(chatsWithCounts)
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
          <h1 className="text-3xl font-bold text-gray-900">Meus Chats</h1>
          <p className="text-gray-600 mt-2">Converse com seus clientes sobre os produtos</p>
        </div>

        {chats.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma conversa ainda</h2><p className="text-gray-600">Os clientes ainda não iniciaram conversas com você.</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <Card key={chat.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/chat/${chat.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-blue-600" /></div>
                      <div>
                        <h3 className="font-semibold text-lg">{chat.client.email.split('@')[0]}</h3>
                        <p className="text-sm text-gray-600">Sobre: {chat.product.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500 mb-2"><Clock className="w-4 h-4 mr-1" />{formatDate(chat.created_at)}</div>
                      <Badge variant="outline">{chat._count?.messages || 0} mensagens</Badge>
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