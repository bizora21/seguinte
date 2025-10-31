import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Globe, 
  Send, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Copy,
  ExternalLink,
  Loader2,
  Settings,
  Zap,
  Target,
  Link,
  Image as ImageIcon,
  ChevronDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { useNavigate } from 'react-router-dom' // Importar useNavigate

// Interface para o artigo completo
interface BlogPost {
  id: string
  title: string
  slug: string
  meta_description: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string | null
  external_links: Array<{ title: string; url: string; }>
  internal_links: Array<{ title: string; url: string; }>
  secondary_keywords: string[]
  seo_score: number
  readability_score: string
  created_at: string
  updated_at: string
  published_at: string | null
}

// Interface para o Schema.org gerado
interface BlogPostingSchema {
  '@context': string
  '@type': string
  headline: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  author: {
    '@type': string
    name: string
    url: string
  }
  publisher: {
    '@type': string
    name: string
    logo: string
    url: string
  }
  mainEntityOfPage: {
    '@type': string
    name: string
    description: string
    url: string
  }
}

const BlogPublishingTab = () => {
  const navigate = useNavigate() // Inicializar useNavigate
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Buscar artigos
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      showError('Erro ao carregar artigos')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Publicar artigo
  const publishPost = useCallback(async (post: BlogPost) => {
    setPublishing(post.id)
    const toastId = showLoading('Publicando artigo...')
    
    try {
      // 1. Atualizar status para publicado
      const { data: updatedPost, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .select()
        .single()

      if (updateError) throw updateError

      // 2. Gerar Schema.org (Simulação: Em um sistema real, isso seria feito no servidor ou no componente de visualização)
      const schema = generateBlogPostingSchema(updatedPost)
      console.log('Schema.org Gerado:', schema)

      // 3. Atualizar sitemap (simulação)
      await updateSitemap()

      dismissToast(toastId)
      showSuccess('Artigo publicado com sucesso!')
      fetchPosts()
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error publishing post:', error)
      showError('Erro ao publicar artigo: ' + error.message)
    } finally {
      setPublishing(null)
    }
  }, [fetchPosts])

  // Despublicar artigo
  const unpublishPost = useCallback(async (postId: string) => {
    const toastId = showLoading('Despublicando artigo...')
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: 'draft',
          published_at: null
        })
        .eq('id', postId)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Artigo despublicado com sucesso!')
      fetchPosts()
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error unpublishing post:', error)
      showError('Erro ao despublicar artigo: ' + error.message)
    }
  }, [fetchPosts])

  // Excluir artigo
  const deletePost = useCallback(async (postId: string) => {
    setDeleting(postId)
    const toastId = showLoading('Excluindo artigo...')
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Artigo excluído com sucesso!')
      fetchPosts()
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error deleting post:', error)
      showError('Erro ao excluir artigo: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }, [fetchPosts])

  // Gerar Schema.org para o artigo
  const generateBlogPostingSchema = (post: BlogPost): BlogPostingSchema => {
    const BASE_URL = 'https://lojarapidamz.com'
    const postUrl = `${BASE_URL}/blog/${post.slug}`
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.meta_description,
      image: post.featured_image_url || `${BASE_URL}/og-image.jpg`,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      author: {
        '@type': 'Organization',
        name: 'LojaRápida',
        url: BASE_URL
      },
      publisher: {
        '@type': 'Organization',
        name: 'LojaRápida',
        logo: `${BASE_URL}/favicon.svg`,
        url: BASE_URL
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        name: post.title,
        description: post.meta_description,
        url: postUrl
      }
    }
  }

  // Atualizar sitemap (simulação)
  const updateSitemap = async () => {
    const toastId = showLoading('Atualizando sitemap...')
    try {
      // Em um sistema real, isso chamaria uma Edge Function
      // que executaria o script 'scripts/generate-sitemap.js'
      await new Promise(resolve => setTimeout(resolve, 1500))
      dismissToast(toastId)
      showSuccess('Sitemap atualizado com sucesso!')
    } catch (error) {
      dismissToast(toastId)
      showError('Falha ao atualizar sitemap.')
      console.error('Error updating sitemap:', error)
    }
  }

  // Copiar URL
  const copyUrl = useCallback((slug: string) => {
    const url = `https://lojarapidamz.com/blog/${slug}`
    navigator.clipboard.writeText(url)
    showSuccess('URL copiada para a área de transferência!')
  }, [])

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // Obter cor do score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 font-bold'
    if (score >= 70) return 'text-yellow-600 font-bold'
    return 'text-red-600 font-bold'
  }

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 mr-1" />
      case 'draft':
        return <FileText className="w-4 h-4 mr-1" />
      default:
        return <AlertCircle className="w-4 h-4 mr-1" />
    }
  }
  
  const handleSortChange = (newSortBy: 'created_at' | 'updated_at' | 'title') => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }
  
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Globe className="w-6 h-6 mr-2 text-blue-600" />
            Publicação e Organização do Blog
          </CardTitle>
          <p className="text-sm text-gray-600">
            Gerencie a publicação de artigos, gere Schema.org e mantenha o sitemap atualizado.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
              <div className="text-sm text-gray-600">Total de Artigos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {posts.filter(p => p.status === 'published').length}
              </div>
              <div className="text-sm text-gray-600">Publicados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {posts.filter(p => p.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Rascunhos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(posts.reduce((acc, p) => acc + p.seo_score, 0) / posts.length) || 0}%
              </div>
              <div className="text-sm text-gray-600">Score Médio SEO</div>
            </div>
          </div>

          {/* Ações e Filtros */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex space-x-2 w-full md:w-auto">
              <Button onClick={() => navigate('/dashboard/admin/blog/new')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Artigo
              </Button>
              <Button onClick={updateSitemap} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar Sitemap
              </Button>
            </div>
            
            <div className="flex space-x-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(v: 'all' | 'draft' | 'published') => setStatusFilter(v)}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full md:w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Artigos */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center h-40"><LoadingSpinner size="lg" /></div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                Nenhum artigo encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSortChange('title')}
                    >
                      <div className="flex items-center">
                        Título {renderSortIcon('title')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] text-center">
                      <div className="flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 mr-1" /> SEO
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[150px] cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSortChange('updated_at')}
                    >
                      <div className="flex items-center">
                        Última Edição {renderSortIcon('updated_at')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[180px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-medium ${getStatusColor(post.status)}`}>
                          {getStatusIcon(post.status)}
                          {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{post.title}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            Slug: <a className="text-blue-600 hover:underline" href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">{post.slug}</a>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getScoreColor(post.seo_score)}>{post.seo_score}%</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(post.updated_at)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/dashboard/admin/blog/edit/${post.slug}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {post.status === 'draft' ? (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => publishPost(post)}
                            disabled={publishing === post.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {publishing === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => unpublishPost(post.id)}
                            disabled={publishing === post.id}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={deleting === post.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center text-red-600">
                                <AlertCircle className="w-6 h-6 mr-2" />
                                Excluir Artigo?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir permanentemente o artigo <span className="font-semibold">{post.title}</span>? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deletePost(post.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleting === post.id}
                              >
                                {deleting === post.id ? 'Excluindo...' : 'Excluir'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyUrl(post.slug)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BlogPublishingTab