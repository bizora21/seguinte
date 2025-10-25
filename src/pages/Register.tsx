import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { Link } from 'react-router-dom'
import { showSuccess, showError } from '../utils/toast'
import { Textarea } from '../components/ui/textarea'

const CATEGORIES = [
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'moda', label: 'Moda' },
  { value: 'casa', label: 'Casa & Jardim' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'livros', label: 'Livros' },
  { value: 'acessorios', label: 'Acessórios' },
  { value: 'moveis', label: 'Móveis' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'beleza', label: 'Beleza & Cosméticos' },
  { value: 'saude', label: 'Saúde' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'outros', label: 'Outros' }
]

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'cliente' | 'vendedor'>('cliente')
  const [storeName, setStoreName] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category])
    } else {
      setSelectedCategories(prev => prev.filter(cat => cat !== category))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      showError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (role === 'vendedor') {
      if (!storeName.trim()) {
        showError('Vendedores precisam informar o nome da loja')
        return
      }
      if (selectedCategories.length === 0) {
        showError('Vendedores precisam selecionar pelo menos uma categoria')
        return
      }
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password, role, storeName, storeDescription, selectedCategories)

      if (error) {
        showError(error)
      } else {
        showSuccess('Conta criada com sucesso! Faça login para continuar.')
        navigate('/login')
      }
    } catch (error) {
      showError('Erro inesperado ao criar conta')
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
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
                minLength={6}
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nome da Loja *</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Descrição da Loja</Label>
                  <Textarea
                    id="storeDescription"
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Descreva sua loja e seus produtos"
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categorias da Loja *</Label>
                  <p className="text-sm text-gray-600">Selecione as categorias de produtos que você vende (mínimo 1):</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50">
                    {CATEGORIES.map((category) => (
                      <div key={category.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.value}
                          checked={selectedCategories.includes(category.value)}
                          onCheckedChange={(checked) => handleCategoryChange(category.value, checked as boolean)}
                          disabled={loading}
                        />
                        <Label htmlFor={category.value} className="text-sm font-normal cursor-pointer">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedCategories.length === 0 && (
                    <p className="text-xs text-red-500">Selecione pelo menos uma categoria.</p>
                  )}
                </div>
              </>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (role === 'vendedor' && selectedCategories.length === 0)}
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