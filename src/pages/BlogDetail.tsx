import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowLeft, Calendar, Tag, Link as LinkIcon, ExternalLink, Loader2, Store, Package, AlertCircle } from 'lucide-react'
import { BlogPostWithCategory, LinkItem } from '../types/blog'
import LoadingSpinner from '../components/LoadingSpinner'
import { SEO, generateBreadcrumbSchema } from '../components/SEO'

// Função auxiliar para renderizar Markdown simples (usando o 'prose' do Tailwind)
const renderMarkdown = (content: string) => {
  // 1. Substituições Markdown para HTML
  let htmlContent = content
    // Substituir negrito **texto** por <strong>texto</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Substituir itálico *texto* por <em>texto</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Substituir CTA [CTA: Texto]
    .replace(/\[CTA: (.*?)\]/g, '<div class="my-6 text-center"><a href="/register" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">$1</a></div>');

  // 2. Processamento de linhas para blocos HTML
  const lines = htmlContent.split('\n');
  let finalHtml = '';
  let inList = false;
  let currentParagraph = '';

  const flushParagraph = () => {
    if (currentParagraph.trim().length > 0) {
      finalHtml += `<p>${currentParagraph.trim()}</p>`;
      currentParagraph = '';
    }
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      // Linha vazia: fecha parágrafo e lista
      flushParagraph();
      if (inList) {
        finalHtml += '</ul>';
        inList = false;
      }
      return;
    }

    if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ') || trimmedLine.startsWith('# ')) {
      // Título: fecha parágrafo e lista, adiciona título
      flushParagraph();
      if (inList) {
        finalHtml += '</ul>';
        inList = false;
      }
      if (trimmedLine.startsWith('### ')) {
        finalHtml += `<h3>${trimmedLine.substring(4)}</h3>`;
      } else if (trimmedLine.startsWith('## ')) {
        finalHtml += `<h2>${trimmedLine.substring(3)}</h2>`;
      } else if (trimmedLine.startsWith('# ')) {
        finalHtml += `<h1>${trimmedLine.substring(2)}</h1>`;
      }
    } else if (trimmedLine.startsWith('* ')) {
      // Item de lista: fecha parágrafo
      flushParagraph();
      const listItem = trimmedLine.replace(/^\* (.*)/, '<li>$1</li>');
      if (!inList) {
        finalHtml += '<ul>';
        inList = true;
      }
      finalHtml += listItem;
    } else if (trimmedLine.startsWith('<div')) {
      // CTA: fecha parágrafo e lista, adiciona div
      flushParagraph();
      if (inList) {
        finalHtml += '</ul>';
        inList = false;
      }
      finalHtml += trimmedLine;
    } else {
      // Conteúdo de parágrafo: acumula
      if (inList) {
        // Se estiver em uma lista, mas a linha não for um item de lista, fecha a lista
        finalHtml += '</ul>';
        inList = false;
      }
      currentParagraph += (currentParagraph.length > 0 ? ' ' : '') + trimmedLine;
    }
  });
  
  // Flush final
  flushParagraph();
  if (inList) {
    finalHtml += '</ul>';
  }

  // Remove parágrafos vazios duplicados que podem ter sido inseridos
  finalHtml = finalHtml.replace(/<p><\/p>/g, '');

  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: finalHtml }} />
}

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPostWithCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const BASE_URL = 'https://lojarapidamz.com'

  const fetchPost = useCallback(async () => {
    if (!slug) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('published_articles') // MUDANÇA AQUI
        .select(`
          *,
          category:blog_categories ( name, slug )
        `)
        .eq('slug', slug)
        .eq('status', 'published') // Apenas posts publicados
        .single()

      if (error || !data) {
        setError('Artigo não encontrado ou não publicado.')
        setPost(null)
        return
      }
      
      setPost(data as BlogPostWithCategory)
    } catch (e) {
      console.error('Error fetching blog post:', e)
      setError('Erro ao carregar o artigo.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString))
  }
  
  // Gerar Schema.org BlogPosting
  const generateBlogPostingSchema = useMemo(() => {
    if (!post) return null
    
    const postUrl = `${BASE_URL}/blog/${post.slug}`
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.meta_description,
      image: post.featured_image_url || `${BASE_URL}/og-image.jpg`,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      author: {
        "@type": "Organization",
        name: "LojaRápida",
        url: BASE_URL
      },
      publisher: {
        "@type": "Organization",
        name: "LojaRápida Marketplace",
        logo: {
          "@type": "ImageObject",
          "url": `${BASE_URL}/favicon.svg`,
          "width": 40,
          "height": 40
        },
        url: BASE_URL
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": postUrl
      }
    }
  }, [post])
  
  const breadcrumbs = useMemo(() => {
    if (!post) return []
    return [
        { name: 'Início', url: BASE_URL },
        { name: 'Blog', url: `${BASE_URL}/blog` },
        { name: post.title, url: `${BASE_URL}/blog/${post.slug}` }
    ]
  }, [post])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              {error || 'Artigo não encontrado'}
            </h2>
            <Button onClick={() => navigate('/blog')}>Voltar para o Blog</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // CORREÇÃO: Usar optional chaining e nullish coalescing para garantir que os links são arrays
  const externalLinks: LinkItem[] = (post.external_links as unknown as LinkItem[] || [])
  const internalLinks: LinkItem[] = (post.internal_links as unknown as LinkItem[] || [])

  return (
    <>
      <SEO
        title={post.title}
        description={post.meta_description}
        image={post.featured_image_url || undefined}
        url={`${BASE_URL}/blog/${post.slug}`}
        type="article"
        jsonLd={[generateBlogPostingSchema, generateBreadcrumbSchema(breadcrumbs)]}
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Blog
            </Button>
          </div>

          <Card className="shadow-xl">
            <CardHeader className="p-6 pb-0">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                {post.title}
              </h1>
              <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Publicado em: {formatDate(post.published_at)}
                </div>
                {post.category && (
                    <Link to={`/blog?category=${post.category.slug}`} className="flex items-center text-blue-600 hover:underline">
                        <Tag className="w-4 h-4 mr-1" />
                        {post.category.name}
                    </Link>
                )}
              </div>
            </CardHeader>
            
            <div className="aspect-video w-full overflow-hidden bg-gray-100">
                <img
                    src={post.featured_image_url || '/placeholder.svg'}
                    alt={post.image_alt_text || post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                    }}
                />
            </div>

            <CardContent className="p-6">
              {/* Conteúdo Renderizado */}
              {post.content && renderMarkdown(post.content)}
              
              {/* Links de Referência e Internos */}
              <div className="mt-10 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Links Internos */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center text-green-700">
                        <Package className="w-5 h-5 mr-2" />
                        Conteúdo Relacionado
                    </h3>
                    {internalLinks.length > 0 ? (
                        <ul className="space-y-2 list-disc list-inside text-gray-700">
                            {internalLinks.map((link, index) => (
                                <li key={index}>
                                    <Link to={link.url} className="text-blue-600 hover:underline flex items-center">
                                        <LinkIcon className="w-4 h-4 mr-1" />
                                        {link.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">Nenhum link interno sugerido.</p>
                    )}
                </div>
                
                {/* Links Externos */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center text-blue-700">
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Referências Externas
                    </h3>
                    {externalLinks.length > 0 ? (
                        <ul className="space-y-2 list-disc list-inside text-gray-700">
                            {externalLinks.map((link, index) => (
                                <li key={index}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                        {link.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">Nenhuma referência externa sugerida.</p>
                    )}
                </div>
              </div>
              
              {/* CTA Final */}
              <div className="mt-10 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Pronto para Vender em Moçambique?
                </h2>
                <Button onClick={() => navigate('/register')} size="lg" className="bg-green-600 hover:bg-green-700">
                    <Store className="w-5 h-5 mr-2" />
                    Cadastre-se como Vendedor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default BlogDetail