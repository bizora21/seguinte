import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { MessageCircle, Send, X, Bot, User, ShoppingBag, UserPlus, LogIn, Store } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- NOVA ESTRUTURA DE DADOS ---

interface ChatAction {
  type: 'navigate';
  payload: string;
  label: string;
  icon?: React.ReactNode;
}

interface Message {
  id: string
  text: string
  sender: 'bot' | 'user'
  timestamp: Date
  action?: ChatAction
}

interface KnowledgeTopic {
  intent: string;
  keywords: string[];
  response: string;
  action?: ChatAction;
}

// --- BASE DE CONHECIMENTO EXPANDIDA E ESTRUTURADA ---

const knowledgeBase: KnowledgeTopic[] = [
  {
    intent: 'how_to_buy',
    keywords: ['comprar', 'compro', 'pedido', 'encomenda', 'adicionar ao carrinho'],
    response: 'É muito fácil comprar! Você pode explorar milhares de produtos de vendedores locais. Quer ver os produtos agora?',
    action: { type: 'navigate', payload: '/produtos', label: 'Explorar Produtos', icon: <ShoppingBag className="w-4 h-4 mr-2" /> }
  },
  {
    intent: 'how_to_sell',
    keywords: ['vender', 'vendedor', 'minha loja', 'criar loja'],
    response: 'Ótimo! Para começar a vender, você precisa se cadastrar como vendedor. É rápido e gratuito. Vamos para a página de cadastro?',
    action: { type: 'navigate', payload: '/register', label: 'Cadastrar como Vendedor', icon: <UserPlus className="w-4 h-4 mr-2" /> }
  },
  {
    intent: 'register',
    keywords: ['cadastro', 'registrar', 'criar conta'],
    response: 'Para criar uma conta, vá para a nossa página de cadastro. Você pode se registrar como cliente ou vendedor.',
    action: { type: 'navigate', payload: '/register', label: 'Ir para Cadastro', icon: <UserPlus className="w-4 h-4 mr-2" /> }
  },
  {
    intent: 'login',
    keywords: ['login', 'entrar', 'acessar conta'],
    response: 'Para acessar sua conta, visite a página de login.',
    action: { type: 'navigate', payload: '/login', label: 'Fazer Login', icon: <LogIn className="w-4 h-4 mr-2" /> }
  },
  {
    intent: 'stores',
    keywords: ['lojas', 'vendedores', 'ver lojas'],
    response: 'Temos muitos vendedores incríveis! Você pode explorar todas as lojas na nossa página de lojas.',
    action: { type: 'navigate', payload: '/lojas', label: 'Ver Todas as Lojas', icon: <Store className="w-4 h-4 mr-2" /> }
  },
  {
    intent: 'shipping',
    keywords: ['frete', 'entrega', 'envio', 'receber'],
    response: 'Oferecemos frete para todo Moçambique! O prazo de entrega varia de 5 a 10 dias úteis, dependendo da sua localização. 🚚'
  },
  {
    intent: 'payment',
    keywords: ['pagamento', 'pagar', 'm-pesa', 'emola', 'cartão'],
    response: 'Nosso principal método de pagamento é na entrega! Você paga apenas quando receber o produto. Aceitamos dinheiro, M-Pesa, eMola ou cartão, dependendo do vendedor. 💰'
  },
  {
    intent: 'contact',
    keywords: ['contato', 'falar', 'ajuda', 'suporte'],
    response: 'Para falar com o nosso suporte humano, use os seguintes canais:\n📧 Email: contato@lojarapida.co.mz\n📱 WhatsApp: +258 86 318 1415'
  },
]

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('Olá! Sou o assistente virtual da LojaRápida. Como posso ajudar? 🤖', 'bot')
      setTimeout(() => setShowQuickReplies(true), 500)
    }
    if (!isOpen) {
      setShowQuickReplies(false)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addMessage = (text: string, sender: 'bot' | 'user', action?: ChatAction) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      action
    }
    setMessages(prev => [...prev, newMessage])
  }

  // --- LÓGICA DE RESPOSTA MELHORADA ---
  const getBotResponse = (userInput: string): KnowledgeTopic | null => {
    const input = userInput.toLowerCase()
    
    for (const topic of knowledgeBase) {
      for (const keyword of topic.keywords) {
        if (input.includes(keyword)) {
          return topic
        }
      }
    }
    
    return null
  }

  const handleSendMessage = (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text) return

    addMessage(text, 'user')
    setInputValue('')
    setShowQuickReplies(false)
    setIsTyping(true)

    setTimeout(() => {
      const topic = getBotResponse(text)
      
      if (topic) {
        addMessage(topic.response, 'bot', topic.action)
      } else {
        // Fallback inteligente: só sugere WhatsApp se não encontrar resposta
        addMessage('Desculpe, não entendi sua pergunta. Tente reformular ou, se preferir, fale com um de nossos atendentes no WhatsApp.', 'bot')
      }
      
      setIsTyping(false)
    }, 1200)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handleActionClick = (action: ChatAction) => {
    if (action.type === 'navigate') {
      navigate(action.payload)
      setIsOpen(false)
    }
  }

  const quickReplies = [
    { label: 'Como comprar?', value: 'Como posso comprar produtos?' },
    { label: 'Quero vender', value: 'Como me torno um vendedor?' },
    { label: 'Ver lojas', value: 'Quero ver as lojas disponíveis' },
  ]

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
          aria-label="Abrir chat de suporte"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 h-[450px] sm:w-96 sm:h-[500px]"
          >
            <Card className="h-full flex flex-col shadow-xl">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Bot className="w-5 h-5 mr-2" />
                    Suporte LojaRápida
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-green-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                        <p className="text-sm break-words">{message.text}</p>
                      </div>
                      {/* RENDERIZAÇÃO DOS BOTÕES DE AÇÃO */}
                      {message.action && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                          <Button
                            onClick={() => handleActionClick(message.action!)}
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-white"
                          >
                            {message.action.icon}
                            {message.action.label}
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {showQuickReplies && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mb-3">
                    {quickReplies.map(reply => (
                      <Button key={reply.label} variant="outline" size="sm" onClick={() => handleSendMessage(reply.value)}>
                        {reply.label}
                      </Button>
                    ))}
                  </motion.div>
                )}

                <div className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot