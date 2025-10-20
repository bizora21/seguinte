import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Link } from 'react-router-dom'
import { showSuccess, showError } from '../utils/toast'
import { User, Store } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (role: 'cliente' | 'vendedor') => {
    if (!email || !password) {
      showError('Por favor, preencha email e senha')
      return
    }

    setLoading(true)

    try {
      const { error, redirectTo } = await signIn(email, password)

      if (error) {
        showError(error)
      } else {
        const roleText = role === 'vendedor' ? 'vendedor' : 'cliente'
        showSuccess(`Login realizado com sucesso! Bem-vindo(a) ${roleText}.`)
        
        // Redirecionamento baseado no role
        if (redirectTo) {
          setTimeout(() => {
            navigate(redirectTo)
          }, 1000)
        }
      }
    } catch (error) {
      showError('Erro inesperado ao fazer login')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Tenta login como cliente por padrão se o usuário pressionar Enter
    handleLogin('cliente')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Área do Usuário</CardTitle>
            <CardDescription className="text-gray-600">
              Acesse sua conta na LojaRápida - O marketplace de Moçambique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="h-11"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-11"
                  disabled={loading}
                />
              </div>
            </form>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Como deseja entrar?</Label>
              <Button
                onClick={() => handleLogin('cliente')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <User className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Entrando...' : 'Entrar como Cliente'}
              </Button>
              <Button
                onClick={() => handleLogin('vendedor')}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Store className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Entrando...' : 'Entrar como Vendedor'}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-green-600 hover:text-green-500 font-medium">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login