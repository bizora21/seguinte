// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// @ts-ignore
const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

function base64url(data: ArrayBuffer | string): string {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : new Uint8Array(data)
  let str = ''
  for (const byte of bytes) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function getAccessToken(serviceAccount: {
  client_email: string
  private_key: string
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const signingInput = `${header}.${payload}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  )
  const jwt = `${signingInput}.${base64url(signatureBuffer)}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error(`OAuth2 token error: ${JSON.stringify(tokenData)}`)
  }
  return tokenData.access_token
}

const BASE_URL = 'https://lojarapidamz.com'

async function sendFcmMessage(
  projectId: string,
  accessToken: string,
  token: string,
  title: string,
  body: string,
  url?: string,
  image?: string,
  data?: Record<string, string>
): Promise<{ ok: boolean; invalid: boolean }> {
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL

  const notification: Record<string, string> = { title, body }
  if (image) notification.image = image

  const webpushNotification: Record<string, string> = {
    icon: `${BASE_URL}/logo.png`,
  }
  if (image) webpushNotification.image = image

  const androidNotification: Record<string, string> = { icon: 'logo' }
  if (image) androidNotification.image = image
  if (url) androidNotification.click_action = fullUrl

  const message: Record<string, unknown> = {
    token,
    notification,
    webpush: {
      notification: webpushNotification,
      fcm_options: { link: fullUrl },
    },
    android: {
      notification: androidNotification,
    },
  }
  if (data && Object.keys(data).length > 0) {
    // FCM data values must be strings
    message.data = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    )
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    }
  )

  if (res.ok) return { ok: true, invalid: false }

  const errBody = await res.json().catch(() => ({}))
  const status = res.status
  // 404 = token not found, 410 = token unregistered — remove these
  const invalid = status === 404 || status === 410 ||
    errBody?.error?.details?.some?.((d: { errorCode?: string }) =>
      d.errorCode === 'UNREGISTERED' || d.errorCode === 'INVALID_ARGUMENT'
    )

  return { ok: false, invalid }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id, title, body, url, image, data } = await req.json()

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'user_id, title and body are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Load service account from Supabase secret
    // @ts-ignore
    const saRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if (!saRaw) {
      return new Response(
        JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not configured' }),
        { status: 500, headers: corsHeaders }
      )
    }
    const serviceAccount = JSON.parse(saRaw)

    // Fetch all FCM tokens for this user
    const { data: rows, error: dbErr } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', user_id)

    if (dbErr) throw dbErr
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: 'No tokens for user' }),
        { status: 200, headers: corsHeaders }
      )
    }

    const accessToken = await getAccessToken(serviceAccount)
    const projectId = serviceAccount.project_id

    let sent = 0
    let failed = 0
    const invalidTokens: string[] = []

    for (const row of rows) {
      const result = await sendFcmMessage(
        projectId,
        accessToken,
        row.token,
        title,
        body,
        url,
        image,
        data
      )
      if (result.ok) {
        sent++
      } else {
        failed++
        if (result.invalid) invalidTokens.push(row.token)
      }
    }

    // Remove invalid/unregistered tokens
    if (invalidTokens.length > 0) {
      await supabase
        .from('fcm_tokens')
        .delete()
        .in('token', invalidTokens)
    }

    return new Response(
      JSON.stringify({ sent, failed }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('[send-push-notification]', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
