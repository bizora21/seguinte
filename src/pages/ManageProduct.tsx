import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { supabase } from '../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import SupabaseImageUpload from '../components/SupabaseImageUpload' // ATUALIZADO
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Product } from '../types/product'
import LoadingSpinner from '../components/LoadingSpinner'

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

const ManageProduct = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: [] as string[],
    stock: '',
    category: ''
  })
  const [allowedCategories, setAllowedCategories] = useState<string[]>([])

  useEffect(() => {
    if (user?.profile?.role === 'vendedor') {
      setAllowedCategories(user.profile.store_categories || [])
      if (productId) {
        fetchProduct(productId)
      } else {
        setLoading(false)
      }
    }
  }, [user, productId])

  const fetchProduct = async (id: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('seller_id', user!.id)
        .single()

      if (error || !data) {
        showError('Produto não encontrado ou você não tem permissão para editá-lo.')
        navigate('/dashboard')
        return
      }

      const product = data as Product
      let images: string[] = []
      try {
        images = JSON.parse(product.image_url || '[]')
      } catch {}

      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        images: images,
        stock: product.stock.toString(),
        category: product.category || ''
      })
    } catch (error) {
      showError('Erro ao carregar produto para edição.')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (user?.profile?.role !== 'vendedor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
            <CardDescription className="text-center">
              Apenas vendedores podem gerenciar produtos
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
    if (!formData.category) {
      showError('Selecione a categoria do produto')
      return false
    }
    if (!allowedCategories.includes(formData.category)) {
      showError('A categoria selecionada não está nas categorias permitidas para sua loja.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    const action = productId ? 'Atualizando' : 'Adicionando'
    const toastId = showLoading(`${action} produto...`)

    try {
      const imageUrlsJson = JSON.stringify(formData.images)
      const productData = {
        seller_id: user.id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image_url: imageUrlsJson, 
        stock: parseInt(formData.stock),
        category: formData.category
      }

      let error
      if (productId) {
        const result = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .eq('seller_id', user!.id)
        error = result.error
      } else {
        const result = await supabase
          .from('products')
          .insert(productData)
        error = result.error
      }

      if (error) {
        showError(`${action} falhou: ` + error.message)
      } else {
        dismissToast(toastId)
        showSuccess(`Produto ${productId ? 'atualizado' : 'adicionado'} com sucesso!`)
        
        setTimeout(() => {
          navigate('/dashboard?tab=products')
        }, 1500)
      }
    } catch (error) {
      showError('Erro inesperado ao processar produto')
      console.error('Manage product error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const availableCategories = CATEGORIES.filter(cat => allowedCategories.includes(cat.value))
  const isEditing = !!productId

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard?tab=products')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Produtos
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing ? `Editando: ${formData.name}` : 'Preencha as informações do novo produto'}
          </p>
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                    disabled={submitting}
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
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={submitting || availableCategories.length === 0}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Nenhuma categoria definida na loja</div>
                    ) : (
                      availableCategories.map((cat) => {
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
                {allowedCategories.length === 0 && (
                  <p className="text-sm text-red-500">
                    Defina as categorias da sua loja nas Configurações do Dashboard.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Imagens do Produto *</Label>
                {/* CORREÇÃO: Usar 'products' como subpasta */}
                <SupabaseImageUpload
                  value={formData.images}
                  onChange={handleImagesChange}
                  bucket="product-images"
                  folder="products"
                  maxImages={2}
                  maxSizeMB={2}
                />
                <p className="text-sm text-gray-500">
                  Envie até 2 imagens. A primeira imagem será a principal.
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {isEditing ? (
                    <><Save className="w-4 h-4 mr-2" /> {submitting ? 'Salvando...' : 'Salvar Alterações'}</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> {submitting ? 'Adicionando...' : 'Adicionar Produto'}</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard?tab=products')}
                  disabled={submitting}
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

export default ManageProduct