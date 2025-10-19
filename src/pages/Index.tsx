import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

const Index = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {user ? (
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Bem-vindo à LojaRápida!</CardTitle>
                <CardDescription>
                  {user.profile?.role === 'vendedor' 
                    ? `Gerencie sua loja: ${user.profile.store_name}`
                    : 'Descubra produtos incríveis'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Logado como: <strong>{user.email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Tipo de conta: <span className="capitalize">{user.profile?.role}</span>
                </p>
                <Button onClick={() => navigate('/login')}>
                  Ir para o painel
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bem-vindo à LojaRápida
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              A plataforma rápida e fácil para comprar e vender online
            </p>
            <div className="space-x-4">
              <Button size="lg" onClick={() => navigate('/register')}>
                Começar Agora
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                Fazer Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Index