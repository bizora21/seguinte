import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getUserChats } from '../utils/chat'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, MessageCircle, Store, User, Clock } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const MyChats = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  const fetchChats = async () => {
    if (!user) return

    setLoading(true)
    try {
      const role = user.profile?.role === 'vendedor' ? 'seller' : 'client'
      const { data, error } = await getUserChats(user.id, role)

      if (error) {
        console.error('Error fetching chats:', error)
      } else {
        setChats(data || [])
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.profile?.role === 'vendedor' ? 'Meus Chats' : 'Minhas Conversas'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.profile?.role === 'vendedor' 
              ? 'Converse com seus clientes sobre os produtos'
              : 'Converse com os vendedores sobre os produtos'
            }
          </p>
        </div>

        {chats.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {user?.profile?.role === 'vendedor' 
                  ? 'Nenhuma conversa ainda'
                  : 'Nenhuma conversa ainda'
                }
              </h2>
              <p className="text-gray-600 mb-6">
                {user?.profile?.role === 'vendedor'
                  ? 'Os clientes ainda não iniciaram conversas com você.'
                  : 'Inicie uma conversa com um vendedor a partir da página do produto.'
                }
              </p>
              <Button onClick={() => navigate('/')}>
                {user?.profile?.role === 'vendedor'
                  ? 'Ver Meus Produtos'
                  : 'Explorar Produtos'
                }
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              const isSeller = user?.profile?.role === 'vendedor'
              const otherPerson = isSeller ? chat.client : chat.seller
              
              return (
                <Card 
                  key={chat.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isSeller ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {isSeller ? (
                            <User className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Store className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {/* 🔥 CORREÇÃO: Verificação defensiva com optional chaining */}
                            {isSeller 
                              ? otherPerson?.email?.split('@')[0] || 'Usuário'
                              : otherPerson?.store_name || otherPerson?.email?.split('@')[0] || 'Loja'
                            }
                          </h3>
                          <p className="text-sm text-gray-600">
                            {/* 🔥 CORREÇÃO: Verificação defensiva */}
                            Sobre: {chat.product?.name || 'Produto'}
                          </p>
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyChats