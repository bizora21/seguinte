import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const BASE = 'https://lojarapidamz.com'
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

const urls = []
for (const page of staticPages) {
  urls.push(urlEntry(BASE + page.url, today, page.changefreq, page.priority))
}

// Tenta buscar dados dinâmicos se tiver credenciais
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const [articlesRes, productsRes, storesRes] = await Promise.all([
      supabase.from('published_articles').select('slug, updated_at').eq('status', 'published').order('updated_at', { ascending: false }),
      // Nota: products não tem coluna updated_at — usa created_at.
      supabase.from('products').select('id, created_at').not('image_url', 'is', null).limit(500),
      supabase.from('profiles').select('id, updated_at').eq('role', 'vendedor'),
    ])

    if (articlesRes.error) console.error('Sitemap: erro a buscar articles -', articlesRes.error.message)
    if (productsRes.error) console.error('Sitemap: erro a buscar products -', productsRes.error.message)
    if (storesRes.error)   console.error('Sitemap: erro a buscar stores -',   storesRes.error.message)

    const articles = articlesRes.data || []
    const products = productsRes.data || []
    const stores   = storesRes.data   || []

    for (const article of articles) {
      const lastmod = article.updated_at?.split('T')[0] || today
      urls.push(urlEntry(BASE + '/blog/' + article.slug, lastmod, 'weekly', '0.8'))
    }
    for (const product of products) {
      const lastmod = product.created_at?.split('T')[0] || today
      urls.push(urlEntry(BASE + '/produto/' + product.id, lastmod, 'weekly', '0.7'))
    }
    for (const store of stores) {
      const lastmod = store.updated_at?.split('T')[0] || today
      urls.push(urlEntry(BASE + '/loja/' + store.id, lastmod, 'weekly', '0.6'))
    }
    console.log('Sitemap dinamico: artigos=' + articles.length + ' produtos=' + products.length + ' lojas=' + stores.length)
  } catch(e) {
    console.log('Aviso: dados dinamicos nao carregados -', e.message)
  }
} else {
  console.log('Aviso: credenciais Supabase nao encontradas - sitemap apenas com paginas estaticas')
}

const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>'
const outputPath = resolve(process.cwd(), 'public', 'sitemap.xml')
writeFileSync(outputPath, xml, 'utf8')
console.log('Sitemap gerado: ' + urls.length + ' URLs -> ' + outputPath)
