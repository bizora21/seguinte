import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ArrowLeft, Save, Plus, Trash2, Link, Image as ImageIcon, FileText, Globe, Loader2 } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import LoadingSpinner from '../components/LoadingSpinner'

// Interface para o artigo completo (simplificada para o formulário)
interface BlogPostFormData {
  title: string
  slug: string
  meta_description: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string
  secondary_keywords: string
}

const initialFormData: BlogPostFormData = {
  title: '',
  slug: '',
  meta_description: '',
  content: '',
  status: 'draft',
  featured_image_url: '',
  secondary_keywords: ''
}

const ManageBlogPost = () => {
  const navigate = useNavigate()
  const { slug: postSlug } = useParams<{ slug: string }>()
  const isEditing = !!postSlug

  const [formData, setFormData] = useState<BlogPostFormData>(initialFormData)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [postId, setPostId] = useState<string | null>(null)

  // Função para gerar slug automaticamente
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/[\s_-]+/g, '-') // Substitui espaços e hífens múltiplos por um único hífen
      .replace(/^-+|-+$/g, '') // Remove hífens no início e fim
  }

  // Efeito para buscar dados se estiver editando
  useEffect(() => {
    if (isEditing) {
      fetchPost(postSlug)
    } else {
      setLoading(false)
    }
  }, [isEditing, postSlug])

  const fetchPost = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        showError('Artigo não encontrado ou acesso negado.')
        navigate('/dashboard/admin/marketing?tab=blog')
        return
      }
      
      setPostId(data.id)
      setFormData({
        title: data.title,
        slug: data.slug,
        meta_description: data.meta_description || '',
        content: data.content,
        status: data.status,
        featured_image_url: data.featured_image_url || '',
        secondary_keywords: (data.secondary_keywords as string[] || []).join(', ')
      })
    } catch (error) {
      showError('Erro ao carregar artigo para edição.')
      navigate('/dashboard/admin/marketing?tab=blog')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newState = { ...prev, [name]: value }
      
      // Atualiza o slug automaticamente se o título mudar e não for edição
      if (name === 'title' && !isEditing) {
        newState.slug = generateSlug(value)
      }
      
      return newState
    })
  }
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawSlug = e.target.value
    setFormData(prev => ({
      ...prev,
      slug: generateSlug(rawSlug)
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.slug.trim()) {
      showError('Título, conteúdo e slug são obrigatórios.')
      return false
    }
    if (formData.slug.length < 5) {
      showError('O slug deve ter pelo menos 5 caracteres.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    const action = isEditing ? 'Atualizando' : 'Criando'
    const toastId = showLoading(`${action} artigo...`)

    try {
      const postData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        meta_description: formData.meta_description.trim() || null,
        content: formData.content,
        status: formData.status,
        featured_image_url: formData.featured_image_url.trim() || null,
        secondary_keywords: formData.secondary_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
        // O updated_at é atualizado pelo trigger do banco
        published_at: formData.status === 'published' && !isEditing ? new Date().toISOString() : null
      }

      let error
      if (isEditing && postId) {
        const result = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', postId)
        error = result.error
      } else {
        const result = await supabase
          .from('blog_posts')
          .insert(postData)
        error = result.error
      }

      if (error) {
        throw error
      }

      dismissToast(toastId)
      showSuccess(`Artigo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`)
      
      // Redirecionar para a lista ou para a edição
      navigate('/dashboard/admin/marketing?tab=blog')

    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error saving post:', error)
      showError(`Erro ao salvar artigo: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
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
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/admin/marketing?tab=blog')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Gerenciamento do Blog
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Artigo' : 'Novo Artigo do Blog'}
          </h1>
          <p className="text-gray-600 mt-2">
            Preencha os detalhes do seu artigo, otimizando para SEO.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Conteúdo Principal
            </CardTitle>
            <CardDescription>
              Use Markdown para formatar o conteúdo do artigo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Título e Slug */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Artigo *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Como Vender Online em Moçambique"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 hidden sm:block">/blog/</span>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      required
                      placeholder="como-vender-online-em-mocambique"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo (Markdown) *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Use # para títulos, ** para negrito, etc."
                  rows={10}
                  disabled={submitting}
                />
              </div>
              
              {/* SEO e Metadados */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center text-blue-800">
                    <Globe className="w-5 h-5 mr-2" />
                    Otimização SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Descrição</Label>
                    <Textarea
                      id="meta_description"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      placeholder="Descrição curta para motores de busca (máx. 160 caracteres)"
                      rows={2}
                      maxLength={160}
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {formData.meta_description.length} / 160
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary_keywords">Palavras-chave Secundárias (separadas por vírgula)</Label>
                    <Input
                      id="secondary_keywords"
                      name="secondary_keywords"
                      value={formData.secondary_keywords}
                      onChange={handleInputChange}
                      placeholder="e-commerce, moçambique, vendas, loja online"
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="featured_image_url" className="flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      URL da Imagem de Destaque
                    </Label>
                    <Input
                      id="featured_image_url"
                      name="featured_image_url"
                      value={formData.featured_image_url}
                      onChange={handleInputChange}
                      placeholder="https://link.para.sua.imagem.jpg"
                      disabled={submitting}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Status e Ações */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published') => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={submitting}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Rascunho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2 flex space-x-4 pt-7">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={submitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? `${action} Artigo...` : isEditing ? 'Salvar Alterações' : 'Criar Artigo'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard/admin/marketing?tab=blog')}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ManageBlogPost