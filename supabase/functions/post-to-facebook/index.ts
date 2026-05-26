// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const SITE_URL = 'https://lojarapidamz.com'
const FB_API_VERSION = 'v19.0'

interface ArticleRecord {
  id: string
  title: string
  slug: string
  status?: string
  meta_description?: string | null
  content?: string | null
  featured_image_url?: string | null
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: ArticleRecord | null
  old_record: ArticleRecord | null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function buildExcerpt(article: ArticleRecord): string {
  if (article.meta_description && article.meta_description.trim()) {
    return article.meta_description.trim()
  }
  if (article.content) {
    const plain = stripHtml(article.content)
    return plain.slice(0, 200) + (plain.length > 200 ? '…' : '')
  }
  return ''
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const FB_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID')
    // @ts-ignore
    const FB_ACCESS_TOKEN = Deno.env.get('FACEBOOK_ACCESS_TOKEN')

    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
      console.error('post-to-facebook: FACEBOOK_PAGE_ID ou FACEBOOK_ACCESS_TOKEN em falta')
      return new Response(
        JSON.stringify({ error: 'Facebook credentials not configured' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const payload: WebhookPayload = await req.json()

    // Só processa INSERT na tabela published_articles
    if (payload.type !== 'INSERT' || payload.table !== 'published_articles') {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'not an INSERT on published_articles' }),
        { status: 200, headers: corsHeaders }
      )
    }

    const article = payload.record
    if (!article || !article.slug || !article.title) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'missing required fields' }),
        { status: 200, headers: corsHeaders }
      )
    }

    // Só publica se status = published (algumas inserts podem ser drafts)
    if (article.status && article.status !== 'published') {
      return new Response(
        JSON.stringify({ skipped: true, reason: `status is ${article.status}` }),
        { status: 200, headers: corsHeaders }
      )
    }

    const url = `${SITE_URL}/blog/${article.slug}`
    const excerpt = buildExcerpt(article)
    const message = excerpt
      ? `${article.title}\n\n${excerpt}\n\n🔗 ${url}`
      : `${article.title}\n\n🔗 ${url}`

    // Facebook Graph API — POST no feed da página
    const fbUrl = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PAGE_ID}/feed`
    const fbBody = new URLSearchParams({
      message,
      link: url,
      access_token: FB_ACCESS_TOKEN,
    })

    const fbResponse = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: fbBody.toString(),
    })

    const fbResult = await fbResponse.json()

    if (!fbResponse.ok) {
      console.error('post-to-facebook: Facebook API error', {
        status: fbResponse.status,
        result: fbResult,
        article_slug: article.slug,
      })
      return new Response(
        JSON.stringify({ error: 'Facebook API error', details: fbResult }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('post-to-facebook: published', {
      article_id: article.id,
      slug: article.slug,
      fb_post_id: fbResult.id,
    })

    return new Response(
      JSON.stringify({ success: true, fb_post_id: fbResult.id, url }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('post-to-facebook: unexpected error', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
