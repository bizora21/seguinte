import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Link, useNavigate } from 'react-router-dom'
import { showSuccess, showError } from '../utils/toast'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'cliente' | 'vendedor'>('cliente')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!email.trim() || !password.trim()) {
      showError('Preencha todos os campos obrigatórios')
      return
    }

    if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      showError('As senhas não coincidem')
      return
    }

    if (role === 'vendedor' && !storeName.trim()) {
      showError('Vendedores precisam informar o nome da loja')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password, role, storeName)

      if (error) {
        if (error.message.includes('already registered')) {
          showError('Este email já está cadastrado. Tente fazer login.')
        } else {
          showError('Erro ao criar conta: ' + error.message)
        }
      } else {
        showSuccess('Conta criada com sucesso! Verifique seu email para confirmar o registro.')
        // Limpa o formulário
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setStoreName('')
        setRole('cliente')
        
        // Redireciona após um breve delay
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (error) {
      console.error('Erro inesperado no registro:', error)
      showError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            Junte-se à LojaRápida
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Digite a senha novamente"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Conta</Label>
              <Select value={role} onValueChange={(value: 'cliente' | 'vendedor') => setRole(value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === 'vendedor' && (
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  placeholder="Nome da sua loja"
                  disabled={loading}
                />
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Faça login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Register