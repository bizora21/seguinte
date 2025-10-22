import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  ArrowLeft, 
  Send, 
  User, 
  Store, 
  Circle,
  Check,
  CheckCheck
} from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { useRealtimeMessages } from '../hooks/useRealtimeMessages'
import { MessageWithSender } from '../types/chat'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatWindowProps {
  productId: string
  sellerId: string
  productName: string
  sellerName?: string
  isOpen: boolean
  onClose: () => void
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  productId,
  sellerId,
  productName,
  sellerName,
  isOpen,
  onClose
}) => {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Hooks personalizados
  const { chatId, loading: chatLoading, error: chatError } = useChat({
    productId,
    clientId: user?.id || '',
    sellerId
  })

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage
  } = useRealtimeMessages({ chatId })

  // Auto-scroll para a última mensagem
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) return

    setSending(true)
    const success = await sendMessage(newMessage.trim(), user.id)
    
    if (success) {
      setNewMessage('')
    }
    
    setSending(false)
  }

  // Formatar hora da mensagem
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return ''
    }
  }

  // Verificar se a mensagem é minha
  const isMyMessage = (message: MessageWithSender) => {
    return message.sender_id === user?.id
  }

  // Obter informações do outro participante
  const getOtherParticipant = () => {
    if (!messages.length) return { name: sellerName || 'Vendedor', isSeller: true }
    
    const firstMessage = messages[0]
    const isSeller = firstMessage.sender_id === sellerId
    
    return {
      name: isSeller 
        ? sellerName || firstMessage.sender.store_name || 'Vendedor'
        : firstMessage.sender.email.split('@')[0],
      isSeller
    }
  }

  const otherParticipant = getOtherParticipant()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {otherParticipant.isSeller ? (
                    <Store className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">
                  {otherParticipant.name}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>
            </div>
            
            <Badge variant="secondary" className="text-xs">
              {productName}
            </Badge>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-hidden p-0">
          {chatLoading || messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : chatError || messagesError ? (
            <div className="flex items-center justify-center h-full text-red-600">
              Erro: {chatError || messagesError}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma mensagem ainda.</p>
                    <p className="text-sm">Seja o primeiro a cumprimentar!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md space-y-1`}>
                        {/* Sender Info (only for other person's messages) */}
                        {!isMyMessage(message) && (
                          <div className="flex items-center space-x-2 px-2">
                            <span className="text-xs font-medium text-gray-600">
                              {message.sender.store_name || message.sender.email.split('@')[0]}
                            </span>
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isMyMessage(message)
                              ? 'bg-blue-600 text-white ml-auto'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                        
                        {/* Timestamp */}
                        <div className={`flex items-center space-x-1 px-2 text-xs ${
                          isMyMessage(message) ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                          {isMyMessage(message) && (
                            <CheckCheck className="w-3 h-3 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={sending || !chatId}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending || !chatId}
                    size="icon"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatWindow