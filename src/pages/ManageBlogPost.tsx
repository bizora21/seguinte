import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ArrowLeft, Save, Plus, Globe, BarChart3, FileText, Eye, CheckCircle } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { BlogCategory, AIGeneratedContent, LinkItem } from '../types/blog'
import OptimizedImageUpload from '../components/Marketing/OptimizedImageUpload'

// Interface para o artigo completo
interface BlogPostFormData {
  title: string
  slug: string
  meta_description: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string
  image_alt_text: string
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
  image_alt_text: '',
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
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
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
            const aiContent: AIGeneratedContent & { 
              category_id: string | null
              featured_image_url?: string
              image_alt_text?: string
            } = JSON.parse(aiContentString)
            
            setFormData({
              title: aiContent.title,
              slug: aiContent.slug,
              meta_description: aiContent.meta_description,
              content: aiContent.content,
              status: 'draft',
              featured_image_url: aiContent.featured_image_url || '',
              image_alt_text: aiContent.image_alt_text || aiContent.image_prompt || '',
              secondary_keywords: aiContent.secondary_keywords.join(', '),
              category_id: aiContent.category_id || '',
              image_prompt: aiContent.image_prompt,
              seo_score: aiContent.seo_score,
              readability_score: aiContent.readability_score,
              external_links: JSON.stringify(aiContent.external_links, null, 2),
              internal_links: JSON.stringify(aiContent.internal_links, null, 2)
            })
            showSuccess('Conteúdo hiper-localizado carregado! Revise e publique.')
            localStorage.removeItem('ai_generated_post')
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
        image_alt_text: data.image_alt_text || '',
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
    if (!formData.featured_image_url) {
      showError('A imagem de destaque é obrigatória para otimização SEO.')
      return false
    }
    if (!formData.image_alt_text.trim()) {
      showError('O texto alt da imagem é obrigatório para acessibilidade.')
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
    const toastId = showLoading(`${actionText} artigo otimizado...`)

    try {
      // Parse links and keywords
      const secondary_keywords = formData.secondary_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      const external_links = JSON.parse(formData.external_links) as LinkItem[]
      const internal_links = JSON.parse(formData.internal_links) as LinkItem[]
      
      const postData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        meta_description: formData.meta_description.trim() || null,
        content: formData.content,
        status: formData.status,
        featured_image_url: formData.featured_image_url.trim(),
        image_alt_text: formData.image_alt_text.trim(),
        secondary_keywords: secondary_keywords,
        category_id: formData.category_id,
        image_prompt: formData.image_prompt.trim() || null,
        seo_score: formData.seo_score || 75,
        readability_score: formData.readability_score,
        external_links: external_links,
        internal_links: internal_links,
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
      showSuccess(`Artigo ${isEditing ? 'atualizado' : 'criado'} com otimização completa!`)
      
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

  const calculateSEOScore = () => {
    let score = 0
    
    // Título (20 pontos)
    if (formData.title.length >= 30 && formData.title.length <= 60) score += 20
    else if (formData.title.length > 0) score += 10
    
    // Meta descrição (20 pontos)
    if (formData.meta_description.length >= 120 && formData.meta_description.length <= 160) score += 20
    else if (formData.meta_description.length > 0) score += 10
    
    // Conteúdo (20 pontos)
    if (formData.content.length >= 1500) score += 20
    else if (formData.content.length >= 800) score += 15
    else if (formData.content.length > 0) score += 5
    
    // Imagem (15 pontos)
    if (formData.featured_image_url && formData.image_alt_text) score += 15
    else if (formData.featured_image_url) score += 8
    
    // Palavras-chave (10 pontos)
    const keywordCount = formData.secondary_keywords.split(',').filter(k => k.trim()).length
    if (keywordCount >= 5) score += 10
    else if (keywordCount >= 3) score += 7
    
    // Categoria (5 pontos)
    if (formData.category_id) score += 5
    
    // Links (10 pontos)
    try {
      const extLinks = JSON.parse(formData.external_links)
      const intLinks = JSON.parse(formData.internal_links)
      if (extLinks.length >= 2 && intLinks.length >= 2) score += 10
      else if (extLinks.length >= 1 || intLinks.length >= 1) score += 5
    } catch {}
    
    return Math.min(100, score)
  }

  // Atualizar SEO score em tempo real
  useEffect(() => {
    const score = calculateSEOScore()
    setFormData(prev => ({ ...prev, seo_score: score }))
  }, [formData.title, formData.meta_description, formData.content, formData.featured_image_url, formData.image_alt_text, formData.secondary_keywords, formData.category_id, formData.external_links, formData.internal_links])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Editor avançado com otimização completa para SEO e Google Discover
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Coluna Principal: Editor */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Conteúdo Principal
                </CardTitle>
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
                        placeholder="Ex: Guia Definitivo: Como Vender Online em Moçambique"
                        disabled={submitting}
                      />
                      <p className="text-xs text-gray-500">
                        {formData.title.length} caracteres (ideal: 30-60)
                      </p>
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
                          placeholder="guia-vender-online-mocambique"
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
                      rows={15}
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500">
                      {formData.content.length} caracteres (ideal: 1500+ para autoridade SEO)
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex space-x-4 pt-6 border-t">
                    <Button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={submitting}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Artigo'}
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
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: SEO e Otimizações */}
          <div className="lg:col-span-1 space-y-6">
            {/* SEO Score */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-green-800">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  SEO Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    formData.seo_score >= 90 ? 'text-green-600' : 
                    formData.seo_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formData.seo_score}%
                  </div>
                  <p className="text-sm text-green-700">
                    {formData.seo_score >= 90 ? 'Excelente!' : 
                     formData.seo_score >= 70 ? 'Bom' : 'Precisa melhorar'}
                  </p>
                </div>
                
                {/* Checklist de SEO */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center">
                    <CheckCircle className={`w-3 h-3 mr-2 ${formData.title.length >= 30 && formData.title.length <= 60 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Título otimizado (30-60 chars)</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className={`w-3 h-3 mr-2 ${formData.meta_description.length >= 120 && formData.meta_description.length <= 160 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Meta descrição ideal</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className={`w-3 h-3 mr-2 ${formData.content.length >= 1500 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Conteúdo extenso (1500+ chars)</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className={`w-3 h-3 mr-2 ${formData.featured_image_url && formData.image_alt_text ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Imagem otimizada</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta Descrição */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Meta Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleInputChange}
                    placeholder="Descrição para motores de busca..."
                    rows={3}
                    maxLength={160}
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {formData.meta_description.length} / 160
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Palavras-chave */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Palavras-chave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    name="secondary_keywords"
                    value={formData.secondary_keywords}
                    onChange={handleInputChange}
                    placeholder="palavra1, palavra2, palavra3"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500">
                    Separadas por vírgula
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Publicação</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published') => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicar Agora</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gestão de Imagem (Seção Expandida) */}
        <div className="mt-6">
          <OptimizedImageUpload
            value={formData.featured_image_url}
            altText={formData.image_alt_text}
            imagePrompt={formData.image_prompt}
            onImageChange={(url) => setFormData(prev => ({ ...prev, featured_image_url: url }))}
            onAltTextChange={(alt) => setFormData(prev => ({ ...prev, image_alt_text: alt }))}
            onPromptChange={(prompt) => setFormData(prev => ({ ...prev, image_prompt: prompt }))}
          />
        </div>

        {/* Links (Seção Expandida) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links Internos (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="internal_links"
                value={formData.internal_links}
                onChange={handleInputChange}
                placeholder='[{"title": "Produtos", "url": "/produtos"}]'
                rows={5}
                disabled={submitting}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links Externos (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="external_links"
                value={formData.external_links}
                onChange={handleInputChange}
                placeholder='[{"title": "Estatísticas", "url": "https://exemplo.com"}]'
                rows={5}
                disabled={submitting}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ManageBlogPost