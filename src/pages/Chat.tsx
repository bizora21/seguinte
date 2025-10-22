import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Message, MessageWithSender, ChatWithDetails } from '../types/chat'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ArrowLeft, Send, User, Store } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

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
    if (!chatId || !user) {
      navigate('/login')
      return
    }

    fetchChatAndMessages()
    const subscription = setupRealtimeSubscription()

    return () => {
      subscription.unsubscribe()
    }
  }, [chatId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatAndMessages = async () => {
    try {
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          product:products ( name ),
          client:profiles!chats_client_id_fkey ( email, store_name ),
          seller:profiles!chats_seller_id_fkey ( email, store_name )
        `)
        .eq('id', chatId!)
        .single()

      if (chatError) throw chatError
      setChat(chatData)

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey ( email, store_name )
        `)
        .eq('chat_id', chatId!)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData || [])

    } catch (error) {
      console.error('Error fetching chat data:', error)
      navigate('/meus-chats')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    console.log(`🔧 Setting up realtime subscription for chat ${chatId} as user ${user?.id}`)
    
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
        async (payload) => {
          console.log('📨 New message received via realtime:', payload)
          
          const newMessage = payload.new as Message
          
          if (newMessage.sender_id !== user?.id) {
            console.log(`📬 Message from another user: ${newMessage.sender_id}`)
            
            const { data: senderData } = await supabase
              .from('profiles')
              .select('email, store_name')
              .eq('id', newMessage.sender_id)
              .single()
            
            const messageWithSender: MessageWithSender = {
              ...newMessage,
              sender: senderData || { email: 'Desconhecido' }
            }

            console.log('✅ Adding message to state:', messageWithSender)
            setMessages(prev => {
              const updated = [...prev, messageWithSender]
              console.log('📝 Updated messages list:', updated)
              return updated
            })
          } else {
            console.log('📤 This is my own message, not adding to realtime')
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`)
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime subscription active for chat ${chatId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error')
        }
      })

    console.log('🔗 Channel created:', channel)
    return channel
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) return
    setSending(true)

    console.log(`📤 Sending message: "${newMessage.trim()}" from user ${user.id}`)

    const optimisticMessage: MessageWithSender = {
      id: Date.now().toString(),
      chat_id: chatId,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender: {
        email: user.email,
        store_name: user.profile?.store_name
      }
    }
    
    setMessages(prev => {
      const updated = [...prev, optimisticMessage]
      console.log('📝 Added optimistic message:', updated)
      return updated
    })
    setNewMessage('')

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: newMessage.trim()
        })

      if (error) {
        console.error('❌ Error sending message:', error)
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      } else {
        console.log('✅ Message sent successfully')
      }
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

  const formatTime = (dateString: string) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))
  const isMyMessage = (message: MessageWithSender) => message.sender_id === user?.id

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (!chat) return <div className="min-h-screen flex items-center justify-center"><p>Chat não encontrado.</p></div>

  const otherUser = user.id === chat.client_id ? chat.seller : chat.client
  const otherUserType = user.id === chat.client_id ? 'seller' : 'client'

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4 h-[calc(100vh-2rem)]">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => navigate('/meus-chats')}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                  <CardTitle className="text-lg flex items-center">
                    {otherUserType === 'seller' ? <Store className="w-5 h-5 mr-2" /> : <User className="w-5 h-5 mr-2" />}
                    {/* 🔥 CORREÇÃO: Verificação defensiva com optional chaining */}
                    {otherUser?.store_name || otherUser?.email?.split('@')[0] || 'Usuário'}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {/* 🔥 CORREÇÃO: Verificação defensiva */}
                    Sobre: {chat.product?.name || 'Produto'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isMyMessage(message) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
                    <p className="break-words">{message.content}</p>
                    <p className={`text-xs mt-1 text-right ${isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(message.created_at)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex space-x-2">
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua mensagem..." disabled={sending} className="flex-1" />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending} size="icon"><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Chat