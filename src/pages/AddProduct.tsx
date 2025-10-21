import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../utils/toast'
import { ArrowLeft } from 'lucide-react'
import ImageUpload from '../components/ImageUpload'

const AddProduct = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: [] as string[],
    stock: ''
  })

  // Verificar se usuário é vendedor
  if (user?.profile?.role !== 'vendedor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
            <CardDescription className="text-center">
              Apenas vendedores podem adicionar produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      showError('O nome do produto é obrigatório')
      return false
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      showError('O preço deve ser maior que zero')
      return false
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      showError('O estoque não pode ser negativo')
      return false
    }

    if (formData.images.length === 0) {
      showError('Adicione pelo menos uma imagem do produto')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Usar a primeira imagem como image_url principal
      const imageUrl = formData.images.length > 0 ? formData.images[0] : null

      const { error } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          image_url: imageUrl,
          stock: parseInt(formData.stock)
        })

      if (error) {
        showError('Erro ao adicionar produto: ' + error.message)
      } else {
        showSuccess('Produto adicionado com sucesso!')
        setFormData({
          name: '',
          description: '',
          price: '',
          images: [],
          stock: ''
        })
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      showError('Erro inesperado ao adicionar produto')
      console.error('Add product error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Adicionar Novo Produto</h1>
          <p className="text-gray-600 mt-2">Preencha as informações do produto abaixo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>
              Todos os campos marcados com * são obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: iPhone 15 Pro"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva o produto, suas características, etc."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (MZN) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque *</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagens do Produto *</Label>
                <ImageUpload
                  value={formData.images}
                  onChange={handleImagesChange}
                  maxImages={2}
                  maxSizeMB={1}
                />
                <p className="text-sm text-gray-500">
                  Adicione até 2 imagens. A primeira imagem será a principal do produto.
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : 'Adicionar Produto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AddProduct