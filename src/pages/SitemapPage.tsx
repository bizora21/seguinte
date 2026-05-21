import { useEffect } from 'react'

export default function SitemapPage() {
  useEffect(() => {
    window.location.replace(
      'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/sitemap'
    )
  }, [])
  return null
}
