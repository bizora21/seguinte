// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const ADMIN_EMAIL = 'lojarapidamz@outlook.com'

// Inicializa o cliente Supabase (para interagir com o banco de dados)
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
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // --- AUTHENTICATION ---
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders })
  }
  const token = authHeader.replace('Bearer ', '')

  // Create a new Supabase client to validate the user's token
  const supabaseClient = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 401, headers: corsHeaders })
  }
  // --- END AUTHENTICATION ---
  
  try {
    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    if (method === 'POST' && action === 'schedule_post') {
      const { content, scheduleTime, platform } = await req.json()
      
      // Lógica: Adicionar tarefa à tabela 'jobs'
      const { data, error } = await supabase.from('jobs').insert({
        type: 'social_post',
        status: 'pending',
        payload: { content, scheduleTime, platform }
      }).select().single()
      
      if (error) throw error
      
      return new Response(JSON.stringify({ success: true, jobId: data.id }), {
        headers: corsHeaders,
        status: 200,
      })
    }
    
    // Implementação futura: Lógica de OAuth e Publicação Imediata
    
    return new Response(JSON.stringify({ message: 'Action not implemented' }), {
      headers: corsHeaders,
      status: 400,
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})