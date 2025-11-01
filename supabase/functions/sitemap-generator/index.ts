// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
}

// @ts-ignore
const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    },
  },
)

// @ts-ignore
const generateSitemapXml = (urls: Array<{loc: string, lastmod: string, changefreq: string, priority: string}>) => {
  const urlset = urls.map(url => {
    return `
    <url>
      <loc>${url.loc}</loc>
      <lastmod>${url.lastmod}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const BASE_URL = 'https://lojarapidamz.com'
    const urls = []

    // URLs estáticas
    const staticUrls = [
      { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/produtos`, changefreq: 'daily', priority: '0.9' },
      { loc: `${BASE_URL}/lojas`, changefreq: 'daily', priority: '0.8' },
      { loc: `${BASE_URL}/blog`, changefreq: 'daily', priority: '0.8' },
      { loc: `${BASE_URL}/sobre-nos`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/faq`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/contato`, changefreq: 'monthly', priority: '0.5' },
    ]

    urls.push(...staticUrls.map(url => ({
      ...url,
      lastmod: new Date().toISOString()
    })))

    // Buscar artigos do blog publicados
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (!blogError && blogPosts) {
      blogPosts.forEach(post => {
        urls.push({
          loc: `${BASE_URL}/blog/${post.slug}`,
          lastmod: post.updated_at,
          changefreq: 'weekly',
          priority: '0.7'
        })
      })
    }

    // Buscar categorias do blog
    const { data: categories, error: catError } = await supabase
      .from('blog_categories')
      .select('slug, created_at')

    if (!catError && categories) {
      categories.forEach(cat => {
        urls.push({
          loc: `${BASE_URL}/blog/categoria/${cat.slug}`,
          lastmod: cat.created_at,
          changefreq: 'weekly',
          priority: '0.6'
        })
      })
    }

    // Buscar produtos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, updated_at')
      .gt('stock', 0)
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (!productsError && products) {
      products.forEach(product => {
        urls.push({
          loc: `${BASE_URL}/produto/${product.id}`,
          lastmod: product.updated_at,
          changefreq: 'weekly',
          priority: '0.8'
        })
      })
    }

    // Buscar lojas
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'vendedor')
      .neq('email', 'lojarapidamz@outlook.com')
      .order('updated_at', { ascending: false })

    if (!sellersError && sellers) {
      sellers.forEach(seller => {
        urls.push({
          loc: `${BASE_URL}/loja/${seller.id}`,
          lastmod: seller.updated_at,
          changefreq: 'weekly',
          priority: '0.7'
        })
      })
    }

    // Gerar XML
    const sitemapXml = generateSitemapXml(urls)
    
    console.log(`Sitemap gerado com ${urls.length} URLs`)
    
    return new Response(sitemapXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
      status: 200,
    })

  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})