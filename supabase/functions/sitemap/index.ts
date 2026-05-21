import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const BASE_URL = 'https://lojarapidamz.com'
  const today = new Date().toISOString().split('T')[0]

  const staticPages = [
    { url: '/',           priority: '1.0', changefreq: 'daily'   },
    { url: '/produtos',   priority: '0.9', changefreq: 'hourly'  },
    { url: '/lojas',      priority: '0.8', changefreq: 'daily'   },
    { url: '/blog',       priority: '0.8', changefreq: 'daily'   },
    { url: '/sobre-nos',  priority: '0.3', changefreq: 'monthly' },
    { url: '/faq',        priority: '0.5', changefreq: 'monthly' },
    { url: '/termos',     priority: '0.1', changefreq: 'yearly'  },
    { url: '/privacidade',priority: '0.1', changefreq: 'yearly'  },
  ]

  const [{ data: articles }, { data: products }, { data: stores }] =
    await Promise.all([
      supabase
        .from('published_articles')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false }),
      supabase
        .from('products')
        .select('id, updated_at')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('profiles')
        .select('id, updated_at')
        .eq('role', 'vendedor')
        .not('store_name', 'is', null),
    ])

  const urls: string[] = []

  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
  }

  for (const article of (articles || [])) {
    const lastmod = article.updated_at?.split('T')[0] || today
    urls.push(`
  <url>
    <loc>${BASE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
  }

  for (const product of (products || [])) {
    const lastmod = product.updated_at?.split('T')[0] || today
    urls.push(`
  <url>
    <loc>${BASE_URL}/produto/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
  }

  for (const store of (stores || [])) {
    const lastmod = store.updated_at?.split('T')[0] || today
    urls.push(`
  <url>
    <loc>${BASE_URL}/loja/${store.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(xml, { headers: corsHeaders })
})
