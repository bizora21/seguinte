export async function onRequest(context) {
  const response = await fetch(
    "https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/sitemap"
  )
  const xml = await response.text()
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    }
  })
}
