import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { MessageCircle, Send, X, Bot, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  text: string
  sender: 'bot' | 'user'
  timestamp: Date
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const responses: Record<string, string> = {
    'como comprar': 'Para comprar produtos: 1️⃣ Navegue pelos produtos ou use a busca 2️⃣ Clique em "Adicionar ao Carrinho" 3️⃣ Vá para o carrinho 4️⃣ Finalize o pedido informando seu endereço. É simples e rápido! 🛒',
    'como vender': 'Para vender produtos: 1️⃣ Cadastre-se como vendedor 2️⃣ Clique em "Adicionar Produto" 3️⃣ Preencha as informações do produto 4️⃣ Seu produto ficará disponível para milhares de clientes! 🚀',
    'vendedor': 'Para se tornar vendedor, clique em "Cadastro" e selecione "Sou Vendedor". Você poderá cadastrar seus produtos e começar a vender imediatamente! 💼',
    'cliente': 'Para comprar, basta navegar pelos produtos, adicionar ao carrinho e finalizar sua compra. Aceitamos pagamento na entrega em todo Moçambique! 🇲🇿',
    'frete': 'Oferecemos frete grátis para todo Moçambique! O prazo de entrega é de 5-10 dias úteis. 🚚',
    'pagamento': 'Aceitamos pagamento na entrega. Você paga apenas quando receber seus produtos! 💰',
    'devolução': 'Oferecemos garantia de satisfação. Caso não esteja satisfeito, entre em contato conosco! 🛡️',
    'contato': 'Para falar conosco: 📧 Email: contato@lojarapida.co.mz 📱 WhatsApp: +258 86 318 1415',
    'moçambique': 'Sim, operamos em todo Moçambique! Entregamos em Maputo, Matola, Beira, Nampula e todas as províncias! 🇲🇿',
    'maputo': 'Entregamos em Maputo e toda a província de Maputo em 5-7 dias úteis! 🏙️'
  }

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('Olá! Sou o assistente virtual da LojaRápida. Como posso ajudar você hoje? 🤖', 'bot')
    }
  }, [isOpen])

  const addMessage = (text: string, sender: 'bot' | 'user') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    // Procurar por correspondências exatas ou parciais
    for (const [key, response] of Object.entries(responses)) {
      if (input.includes(key)) {
        return response
      }
    }
    
    // Respostas baseadas em palavras-chave
    if (input.includes('preço') || input.includes('valor') || input.includes('custo')) {
      return 'Nossos preços são definidos pelos vendedores e variam conforme o produto. Use nossos filtros para encontrar produtos dentro do seu orçamento! 💰'
    }
    
    if (input.includes('entrega') || input.includes('receber')) {
      return 'A entrega é feita em 5-10 dias úteis em todo Moçambique. Você receberá atualizações sobre o status do seu pedido! 📦'
    }
    
    if (input.includes('cadastro') || input.includes('registrar')) {
      return 'Para se cadastrar, clique no botão "Cadastro" no topo da página. Escolha entre cliente ou vendedor e preencha seus dados! 📝'
    }
    
    return 'Não entendi sua pergunta. Gostaria de falar com um atendente? Posso te conectar com nosso WhatsApp! 📱'
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    addMessage(userMessage, 'user')
    setInputValue('')
    setIsTyping(true)

    // Simular tempo de resposta do bot
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage)
      addMessage(botResponse, 'bot')
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const openWhatsApp = () => {
    window.open('https://wa.me/258863181415', '_blank')
  }

  return (
    <>
      {/* Botão flutuante */}
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

      {/* Janela do chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 h-96"
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
              
              <CardContent className="flex-1 flex flex-col p-4">
                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {message.sender === 'bot' ? (
                            <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          )}
                          <p className="text-sm break-words">{message.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Botão WhatsApp */}
                {messages.length > 1 && (
                  <div className="mb-3">
                    <Button
                      onClick={openWhatsApp}
                      variant="outline"
                      className="w-full text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Falar com atendente no WhatsApp
                    </Button>
                  </div>
                )}

                {/* Input */}
                <div className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
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