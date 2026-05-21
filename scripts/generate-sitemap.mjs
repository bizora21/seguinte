import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bpzqdwpkwlwflrcwcrqp.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''
const BASE = 'https://lojarapidamz.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const today = new Date().toISOString().split('T')[0]

function urlEntry(loc, lastmod, changefreq, priority) {
  return '<url><loc>' + encodeURI(loc) + '</loc><lastmod>' + lastmod + '</lastmod><changefreq>' + changefreq + '</changefreq><priority>' + priority + '</priority></url>'
}

const staticPages = [
  { url: '/',            priority: '1.0', changefreq: 'daily'   },
  { url: '/produtos',    priority: '0.9', changefreq: 'hourly'  },
  { url: '/lojas',       priority: '0.8', changefreq: 'daily'   },
  { url: '/blog',        priority: '0.8', changefreq: 'daily'   },
  { url: '/sobre-nos',   priority: '0.3', changefreq: 'monthly' },
  { url: '/faq',         priority: '0.5', changefreq: 'monthly' },
  { url: '/termos',      priority: '0.1', changefreq: 'yearly'  },
  { url: '/privacidade', priority: '0.1', changefreq: 'yearly'  },
]

const [{ data: articles }, { data: products }, { data: stores }] = await Promise.all([
  supabase.from('published_articles').select('slug, updated_at').eq('status', 'published').order('updated_at', { ascending: false }),
  supabase.from('products').select('id, updated_at').not('image_url', 'is', null).limit(500),
  supabase.from('profiles').select('id, updated_at').eq('role', 'vendedor'),
])

const urls = []

for (const page of staticPages) {
  urls.push(urlEntry(BASE + page.url, today, page.changefreq, page.priority))
}

for (const article of (articles || [])) {
  const lastmod = article.updated_at?.split('T')[0] || today
  urls.push(urlEntry(BASE + '/blog/' + article.slug, lastmod, 'weekly', '0.8'))
}

for (const product of (products || [])) {
  const lastmod = product.updated_at?.split('T')[0] || today
  urls.push(urlEntry(BASE + '/produto/' + product.id, lastmod, 'weekly', '0.7'))
}

for (const store of (stores || [])) {
  const lastmod = store.updated_at?.split('T')[0] || today
  urls.push(urlEntry(BASE + '/loja/' + store.id, lastmod, 'weekly', '0.6'))
}

const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>'

const outputPath = resolve(process.cwd(), 'public', 'sitemap.xml')
writeFileSync(outputPath, xml, 'utf8')
console.log('Sitemap gerado: ' + urls.length + ' URLs → ' + outputPath)
