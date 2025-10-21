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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (role: 'cliente' | 'vendedor') => {
    // Validação inicial
    if (!email || !password) {
      showError('Por favor, preencha email e senha')
      return
    }

    // Feedback visual imediato
    setIsSubmitting(true)

    try {
      // Chamar API otimizada
      const { error, redirectTo } = await signIn(email, password)

      if (error) {
        showError(error)
        return
      }

      // Sucesso - mostrar feedback e redirecionar
      const roleText = role === 'vendedor' ? 'vendedor' : 'cliente'
      showSuccess(`Login realizado com sucesso! Bem-vindo(a) ${roleText}.`)
      
      // Redirecionamento imediato
      if (redirectTo) {
        navigate(redirectTo, { replace: true })
      }
    } catch (error) {
      showError('Erro inesperado ao fazer login')
      console.error('Login error:', error)
    } finally {
      // Garantir que o loading seja desativado mesmo em caso de erro
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Tenta login como cliente por padrão se o usuário pressionar Enter
    handleLogin('cliente')
  }

  // Loading geral da aplicação (não do botão)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
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
                  disabled={isSubmitting}
                  autoComplete="email"
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
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>
            </form>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Como deseja entrar?</Label>
              <Button
                onClick={() => handleLogin('cliente')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    Entrar como Cliente
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleLogin('vendedor')}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Store className="w-5 h-5 mr-2" />
                    Entrar como Vendedor
                  </>
                )}
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