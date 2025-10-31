import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ArrowLeft, Save, Plus, Trash2, Link, Image as ImageIcon, FileText, Globe, Loader2, Zap, BarChart3 } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { BlogCategory, AIGeneratedContent, LinkItem } from '../types/blog' // Importar tipos de blog

// Interface para o artigo completo (simplificada para o formulário)
interface BlogPostFormData {
  title: string
  slug: string
  meta_description: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string
  secondary_keywords: string
  category_id: string
  image_prompt: string
  seo_score: number
  readability_score: string
  external_links: string // JSON stringified
  internal_links: string // JSON stringified
}

const initialFormData: BlogPostFormData = {
  title: '',
  slug: '',
  meta_description: '',
  content: '',
  status: 'draft',
  featured_image_url: '',
  secondary_keywords: '',
  category_id: '',
  image_prompt: '',
  seo_score: 0,
  readability_score: 'N/A',
  external_links: '[]',
  internal_links: '[]'
}

const ManageBlogPost = () => {
  const navigate = useNavigate()
  const { slug: postSlug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const isEditing = !!postSlug

  const [formData, setFormData] = useState<BlogPostFormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [postId, setPostId] = useState<string | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])

  // Função para gerar slug automaticamente
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/[\s_-]+/g, '-') // Substitui espaços e hífens múltiplos por um único hífen
      .replace(/^-+|-+$/g, '') // Remove hífens no início e fim
  }
  
  // Função para buscar categorias
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      showError('Erro ao carregar categorias do blog.')
    }
  }

  // Efeito principal de carregamento
  useEffect(() => {
    fetchCategories().then(() => {
      if (isEditing) {
        fetchPost(postSlug)
      } else {
        // Verifica se há conteúdo gerado por IA
        const aiContentString = localStorage.getItem('ai_generated_post')
        if (searchParams.get('source') === 'ai' && aiContentString) {
          try {
            const aiContent: AIGeneratedContent & { category_id: string | null } = JSON.parse(aiContentString)
            
            setFormData({
              title: aiContent.title,
              slug: aiContent.slug,
              meta_description: aiContent.meta_description,
              content: aiContent.content,
              status: 'draft',
              featured_image_url: '', // Imagem deve ser gerada/uploadada depois
              secondary_keywords: aiContent.secondary_keywords.join(', '),
              category_id: aiContent.category_id || '',
              image_prompt: aiContent.image_prompt,
              seo_score: aiContent.seo_score,
              readability_score: aiContent.readability_score,
              external_links: JSON.stringify(aiContent.external_links, null, 2),
              internal_links: JSON.stringify(aiContent.internal_links, null, 2)
            })
            showSuccess('Conteúdo gerado por IA carregado com sucesso! Revise e publique.')
            localStorage.removeItem('ai_generated_post') // Limpa o cache
          } catch (e) {
            console.error('Error parsing AI content:', e)
            showError('Erro ao carregar conteúdo gerado por IA.')
          }
        }
        setLoading(false)
      }
    })
  }, [isEditing, postSlug, searchParams])

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
        secondary_keywords: (data.secondary_keywords as string[] || []).join(', '),
        category_id: data.category_id || '',
        image_prompt: data.image_prompt || '',
        seo_score: data.seo_score || 0,
        readability_score: data.readability_score || 'N/A',
        external_links: JSON.stringify(data.external_links || [], null, 2),
        internal_links: JSON.stringify(data.internal_links || [], null, 2)
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
      if (name === 'title' && !isEditing && searchParams.get('source') !== 'ai') {
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
    if (!formData.category_id) {
        showError('A categoria é obrigatória.')
        return false
    }
    
    // Validação de JSON para links
    try {
        JSON.parse(formData.external_links)
        JSON.parse(formData.internal_links)
    } catch {
        showError('Os campos de Links Internos/Externos devem ser JSON válidos.')
        return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    const actionText = isEditing ? 'Atualizando' : 'Criando'
    const toastId = showLoading(`${actionText} artigo...`)

    try {
      // Parse links and keywords
      const secondary_keywords = formData.secondary_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      const external_links = JSON.parse(formData.external_links) as LinkItem[]
      const internal_links = JSON.parse(formData.internal_links) as LinkItem[]
      
      // Simulação de SEO Score (se não veio da IA)
      const finalSeoScore = formData.seo_score > 0 ? formData.seo_score : 75 // Default score se manual

      const postData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        meta_description: formData.meta_description.trim() || null,
        content: formData.content,
        status: formData.status,
        featured_image_url: formData.featured_image_url.trim() || null,
        secondary_keywords: secondary_keywords,
        category_id: formData.category_id,
        image_prompt: formData.image_prompt.trim() || null,
        seo_score: finalSeoScore,
        readability_score: formData.readability_score,
        external_links: external_links,
        internal_links: internal_links,
        published_at: formData.status === 'published' && !isEditing ? new Date().toISOString() : (formData.status === 'published' && isEditing && !postSlug) ? new Date().toISOString() : null
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
      
      // Redirecionar para a lista
      navigate('/dashboard/admin/marketing?tab=blog')

    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error saving post:', error)
      showError(`Erro ao salvar artigo: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }
  
  // Simulação de Geração de Imagem
  const handleGenerateImage = () => {
      if (!formData.image_prompt.trim()) {
          showError('O prompt da imagem está vazio. Por favor, gere o conteúdo por IA primeiro ou insira um prompt manualmente.')
          return
      }
      
      setSubmitting(true)
      const toastId = showLoading('Gerando imagem de destaque por IA...')
      
      // Simulação de chamada à API de imagem
      setTimeout(() => {
          const mockImageUrl = `https://picsum.photos/seed/${formData.slug || 'blog'}/1200/630`
          setFormData(prev => ({ ...prev, featured_image_url: mockImageUrl }))
          dismissToast(toastId)
          showSuccess('Imagem gerada com sucesso! Revise o URL.')
          setSubmitting(false)
      }, 2000)
  }

  const action = isEditing ? 'Atualizando' : 'Criando';

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
              
              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  disabled={submitting || categories.length === 0}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conteúdo */}
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo (Markdown) *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Use Markdown para formatar o conteúdo..."
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
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm font-semibold">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Score SEO: <span className={`ml-1 ${formData.seo_score >= 90 ? 'text-green-600' : formData.seo_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{formData.seo_score}%</span>
                    </div>
                    <div className="flex items-center text-sm font-semibold">
                        <FileText className="w-4 h-4 mr-1" />
                        Leitura: <span className="ml-1 text-blue-600">{formData.readability_score}</span>
                    </div>
                  </div>
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
                  
                  {/* Links Internos e Externos (JSON) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="internal_links">Links Internos (JSON)</Label>
                        <Textarea
                            id="internal_links"
                            name="internal_links"
                            value={formData.internal_links}
                            onChange={handleInputChange}
                            placeholder='[{"title": "Produtos", "url": "/produtos"}]'
                            rows={3}
                            disabled={submitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="external_links">Links Externos (JSON)</Label>
                        <Textarea
                            id="external_links"
                            name="external_links"
                            value={formData.external_links}
                            onChange={handleInputChange}
                            placeholder='[{"title": "Estatísticas", "url": "https://exemplo.com"}]'
                            rows={3}
                            disabled={submitting}
                        />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Imagem de Destaque */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center text-yellow-800">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Imagem de Destaque
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="image_prompt">Prompt de Geração de Imagem (IA)</Label>
                        <Textarea
                            id="image_prompt"
                            name="image_prompt"
                            value={formData.image_prompt}
                            onChange={handleInputChange}
                            placeholder="Descreva a imagem que você quer gerar..."
                            rows={2}
                            disabled={submitting}
                        />
                        <Button 
                            type="button" 
                            onClick={handleGenerateImage} 
                            disabled={submitting || !formData.image_prompt.trim()}
                            variant="secondary"
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            {submitting ? 'Gerando...' : 'Gerar Imagem com IA'}
                        </Button>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="featured_image_url">URL da Imagem de Destaque *</Label>
                        <Input
                            id="featured_image_url"
                            name="featured_image_url"
                            value={formData.featured_image_url}
                            onChange={handleInputChange}
                            placeholder="https://link.para.sua.imagem.jpg"
                            disabled={submitting}
                        />
                        {formData.featured_image_url && (
                            <img src={formData.featured_image_url} alt="Preview" className="mt-2 max-h-40 object-contain rounded-lg border" />
                        )}
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