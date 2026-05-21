import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BASE_URL = 'https://lojarapidamz.com'

const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily',   priority: '1.0' },
  { loc: '/produtos', changefreq: 'hourly',  priority: '0.9' },
  { loc: '/lojas',    changefreq: 'daily',   priority: '0.8' },
  { loc: '/blog',     changefreq: 'daily',   priority: '0.8' },
  { loc: '/sobre-nos', changefreq: 'monthly', priority: '0.4' },
  { loc: '/faq',      changefreq: 'monthly', priority: '0.5' },
  { loc: '/contato',  changefreq: 'monthly', priority: '0.4' },
  { loc: '/termos',   changefreq: 'yearly',  priority: '0.1' },
  { loc: '/privacidade', changefreq: 'yearly', priority: '0.1' },
  { loc: '/politica-vendedor', changefreq: 'yearly', priority: '0.2' },
]

function url(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string
) {
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

function toDate(iso: string | null) {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return iso.slice(0, 10)
}

async function buildSitemap(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)

  const staticEntries = STATIC_PAGES.map(p =>
    url(p.loc, today, p.changefreq, p.priority)
  ).join('\n')

  const [{ data: articles }, { data: products }, { data: stores }] =
    await Promise.all([
      supabase
        .from('published_articles')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase
        .from('products')
        .select('id, updated_at')
        .eq('status', 'active')
        .limit(500),
      supabase
        .from('profiles')
        .select('id, updated_at')
        .eq('role', 'vendedor')
        .limit(200),
    ])

  const articleEntries = (articles || [])
    .map(a =>
      url(
        `/blog/${a.slug}`,
        toDate(a.updated_at || a.published_at),
        'weekly',
        '0.8'
      )
    )
    .join('\n')

  const productEntries = (products || [])
    .map(p =>
      url(`/produto/${p.id}`, toDate(p.updated_at), 'daily', '0.7')
    )
    .join('\n')

  const storeEntries = (stores || [])
    .map(s =>
      url(`/loja/${s.id}`, toDate(s.updated_at), 'weekly', '0.6')
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${staticEntries}

${articleEntries}

${productEntries}

${storeEntries}

</urlset>`
}

const SitemapPage = () => {
  useEffect(() => {
    buildSitemap().then(xml => {
      document.open('text/xml')
      document.write(xml)
      document.close()
    })
  }, [])

  return null
}

export default SitemapPage
