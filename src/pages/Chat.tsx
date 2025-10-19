import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MessageWithSender, ChatWithDetails } from '../types/chat'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ArrowLeft, Send, User, Store } from 'lucide-react'

const Chat = () => {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chat, setChat] = useState<ChatWithDetails | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatId) {
      fetchChat()
      fetchMessages()
      setupRealtimeSubscription()
    }

    return () => {
      supabase.channel(`chat-${chatId}`).unsubscribe()
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChat = async () => {
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
        .eq('id', chatId!)
        .single()

      if (error) {
        console.error('Error fetching chat:', error)
        navigate('/meus-chats')
        return
      }

      setChat(data)
    } catch (error) {
      console.error('Error fetching chat:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:auth.users (
            email
          )
        `)
        .eq('chat_id', chatId!)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          
          // Buscar informações completas do remetente
          fetchSenderInfo(payload.new as any).then(messageWithSender => {
            setMessages(prev => [...prev, messageWithSender])
          })
        }
      )
      .subscribe()

    console.log('Realtime subscription set up for chat:', chatId)
  }

  const fetchSenderInfo = async (message: any) => {
    try {
      const { data: sender } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', message.sender_id)
        .single()

      return {
        ...message,
        sender: {
          email: sender?.email || 'Unknown'
        }
      }
    } catch (error) {
      console.error('Error fetching sender info:', error)
      return {
        ...message,
        sender: {
          email: 'Unknown'
        }
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) {
      return
    }

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: newMessage.trim()
        })

      if (error) {
        console.error('Error sending message:', error)
      } else {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(date)
  }

  const isMyMessage = (message: MessageWithSender) => {
    return message.sender_id === user?.id
  }

  if (!user) {
    navigate('/login')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Chat Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/meus-chats')} className="w-full">
              Voltar para Chats
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const otherUser = user.id === chat.client_id 
    ? { email: chat.seller.email, type: 'seller', name: chat.product.name }
    : { email: chat.client.email, type: 'client', name: chat.client.email.split('@')[0] }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4 h-[calc(100vh-2rem)]">
        <Card className="h-full flex flex-col">
          {/* Header do Chat */}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/meus-chats')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-lg flex items-center">
                    {otherUser.type === 'seller' ? (
                      <Store className="w-5 h-5 mr-2" />
                    ) : (
                      <User className="w-5 h-5 mr-2" />
                    )}
                    {otherUser.type === 'seller' ? chat.product.name : otherUser.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{otherUser.email}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Área de Mensagens */}
          <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhuma mensagem ainda.</p>
                  <p className="text-sm">Seja o primeiro a dizer olá!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1].created_at) !== formatDate(message.created_at)
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-500 my-4">
                          {formatDate(message.created_at)}
                        </div>
                      )}
                      <div className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMyMessage(message)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}>
                          <p className="text-sm font-medium mb-1">
                            {isMyMessage(message) ? 'Você' : message.sender.email.split('@')[0]}
                          </p>
                          <p className="break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="mt-4 flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Chat