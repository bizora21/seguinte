import { supabase } from '../lib/supabase'

const BASE_URL = 'https://lojarapidamz.com'

interface SitemapURL {
  url: string
  lastModified?: string
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

// Gera o XML do sitemap
function generateSitemapXML(urls: SitemapURL[]): string {
  const urlElements = urls.map(({ url, lastModified, changeFrequency, priority }) => `
  <url>
    <loc>${url}</loc>
    ${lastModified ? `<lastmod>${lastModified}</lastmod>` : ''}
    ${changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : ''}
    ${priority !== undefined ? `<priority>${priority}</priority>` : ''}
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`
}

// URLs estáticas do site
const staticUrls: SitemapURL[] = [
  { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
  { url: `${BASE_URL}/produtos`, changeFrequency: 'hourly', priority: 0.9 },
  { url: `${BASE_URL}/lojas`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/sobre-nos`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.7 },
  { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/contato`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE_URL}/termos`, changeFrequency: 'yearly', priority: 0.1 },
  { url: `${BASE_URL}/privacidade`, changeFrequency: 'yearly', priority: 0.1 },
  { url: `${BASE_URL}/politica-vendedor`, changeFrequency: 'yearly', priority: 0.2 },
]

// Busca todos os produtos do banco
async function getProductUrls(): Promise<SitemapURL[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .gt('stock', 0)

    if (error) throw error

    return (products || []).map(product => ({
      url: `${BASE_URL}/produto/${product.id}`,
      lastModified: product.updated_at || product.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))
  } catch (error) {
    console.error('Erro ao buscar produtos para sitemap:', error)
    return []
  }
}

// Busca todas as lojas (vendedores)
async function getStoreUrls(): Promise<SitemapURL[]> {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'vendedor')
      .eq('store_active', true)

    if (error) throw error

    return (profiles || []).map(profile => ({
      url: `${BASE_URL}/loja/${profile.id}`,
      lastModified: profile.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7
    }))
  } catch (error) {
    console.error('Erro ao buscar lojas para sitemap:', error)
    return []
  }
}

// Busca todos os posts do blog
async function getBlogUrls(): Promise<SitemapURL[]> {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, created_at')
      .eq('published', true)

    if (error) throw error

    return (posts || []).map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at || post.created_at,
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  } catch (error) {
    console.error('Erro ao buscar posts para sitemap:', error)
    return []
  }
}

// Função principal que gera o sitemap completo
export async function generateSitemap(): Promise<string> {
  // Busca URLs dinâmicas em paralelo
  const [productUrls, storeUrls, blogUrls] = await Promise.all([
    getProductUrls(),
    getStoreUrls(),
    getBlogUrls()
  ])

  // Combina todas as URLs
  const allUrls = [
    ...staticUrls,
    ...productUrls,
    ...storeUrls,
    ...blogUrls
  ]

  // Gera o XML
  return generateSitemapXML(allUrls)
}

// Função para ser usada em uma API route (Vercel/Netlify)
export default async function handler(req: Request, res: Response) {
  const sitemap = await generateSitemap()

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache de 1 hora
    }
  })
}
