import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowLeft, Calendar, User, Tag, Search, Filter, Globe, Loader2, ArrowRight, FileText } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BlogPostWithCategory, BlogCategory } from '../types/blog'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import LoadingSpinner from '../components/LoadingSpinner'
import { Badge } from '../components/ui/badge'

const BlogPage = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPostWithCategory[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 6

  const fetchBlogData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Buscar Categorias
      const { data: catData, error: catError } = await supabase
        .from('blog_categories')
        .select('*')
      
      if (catError) throw catError
      setCategories(catData || [])

      // 2. Buscar Posts Publicados
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories ( name, slug )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        
      // Aplicar filtros
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }
      
      if (selectedCategory !== 'all') {
        const categoryId = catData?.find(c => c.slug === selectedCategory)?.id
        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }
      }
      
      // Aplicar paginação (simples)
      const offset = (currentPage - 1) * postsPerPage
      query = query.range(offset, offset + postsPerPage - 1)

      const { data: postData, error: postError } = await query

      if (postError) throw postError
      setPosts(postData as BlogPostWithCategory[] || [])

    } catch (error) {
      console.error('Error fetching blog data:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCategory, currentPage])

  useEffect(() => {
    fetchBlogData()
  }, [fetchBlogData])
  
  const handleSearch = () => {
      setCurrentPage(1)
      fetchBlogData()
  }
  
  const handleCategoryChange = (slug: string) => {
      setSelectedCategory(slug)
      setCurrentPage(1)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
            <Globe className="w-8 h-8 mr-3 text-green-600" />
            Blog LojaRápida
          </h1>
          <p className="text-xl text-gray-600">
            Dicas, guias e novidades sobre e-commerce em Moçambique
          </p>
        </div>
        
        {/* Filtros e Busca */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    type="text"
                    placeholder="Buscar artigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                />
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar por Categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
                Buscar
            </Button>
        </div>

        {posts.length === 0 ? (
            <Card>
                <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Nenhum artigo encontrado
                    </h2>
                    <p className="text-gray-600">
                        Tente ajustar os filtros ou a busca.
                    </p>
                </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                    <Link to={`/blog/${post.slug}`} key={post.id}>
                        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100">
                                <img
                                    src={post.featured_image_url || '/placeholder.svg'}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder.svg'
                                    }}
                                />
                            </div>
                            <CardHeader className="flex-1">
                                <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                                <div className="flex items-center text-sm text-gray-500 space-x-4">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {new Date(post.published_at || post.created_at).toLocaleDateString('pt-MZ')}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-4 line-clamp-3">{post.meta_description}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {post.category && (
                                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {post.category.name}
                                        </Badge>
                                    )}
                                    {post.secondary_keywords.slice(0, 2).map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className="bg-gray-100 text-gray-800 text-xs"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                                <Button className="w-full">Ler Mais</Button>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        )}
        
        {/* Paginação (Simulada) */}
        <div className="flex justify-center space-x-4 mt-8">
            <Button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
            >
                Anterior
            </Button>
            <span className="text-gray-600 flex items-center">Página {currentPage}</span>
            <Button 
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={posts.length < postsPerPage}
                variant="outline"
            >
                Próxima
            </Button>
        </div>
      </div>
    </div>
  )
}

export default BlogPage