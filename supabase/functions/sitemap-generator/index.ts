// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      lastmod: new Date().toISOString().split('T')[0]
    })))

    // Buscar artigos do blog publicados
    const { data: blogPosts, error: blogError } = await supabase
      .from('published_articles')
      .select('slug, updated_at')
      .eq('status', 'published')

    if (!blogError && blogPosts) {
      blogPosts.forEach(post => {
        urls.push({
          loc: `${BASE_URL}/blog/${post.slug}`,
          lastmod: new Date(post.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.7'
        })
      })
    }

    // Buscar produtos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, created_at')
      .gt('stock', 0)
      .limit(1000)

    if (!productsError && products) {
      products.forEach(product => {
        urls.push({
          loc: `${BASE_URL}/produto/${product.id}`,
          lastmod: new Date(product.created_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.8'
        })
      })
    }

    // Buscar lojas
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'vendedor')
      .neq('email', 'lojarapidamz@outlook.com')

    if (!sellersError && sellers) {
      sellers.forEach(seller => {
        urls.push({
          loc: `${BASE_URL}/loja/${seller.id}`,
          lastmod: new Date(seller.created_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.7'
        })
      })
    }

    const sitemapXml = generateSitemapXml(urls)
    
    return new Response(sitemapXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})