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
    
    if (method === 'GET' && action === 'get_funnel_data') {
      // Lógica: Tentar buscar do cache primeiro
      const { data: cachedData } = await supabase
        .from('analytics_cache')
        .select('data, cached_at')
        .eq('report_name', 'client_funnel')
        .single()
        
      const cacheDurationHours = 4
      // @ts-ignore
      const isCacheValid = cachedData && (new Date().getTime() - new Date(cachedData.cached_at).getTime()) < (cacheDurationHours * 60 * 60 * 1000)
      
      if (isCacheValid) {
        return new Response(JSON.stringify({ data: cachedData.data, source: 'cache' }), {
          headers: corsHeaders,
          status: 200,
        })
      }
      
      // Se o cache for inválido ou não existir, iniciar o processamento (simulado)
      
      // Lógica real: Chamar Google Analytics API (usando tokens da tabela 'integrations')
      // ...
      
      // Simulação de dados do funil
      const funnelData = {
        visitors: 15000,
        registrations: 1200,
        first_purchases: 350,
        conversion_rate: '2.3%'
      }
      
      // Atualizar cache (simulado)
      await supabase.from('analytics_cache').upsert({
        report_name: 'client_funnel',
        data: funnelData
      })
      
      return new Response(JSON.stringify({ data: funnelData, source: 'api_call' }), {
        headers: corsHeaders,
        status: 200,
      })
    }
    
    // Implementação futura: Lógica de OAuth e outros relatórios
    
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