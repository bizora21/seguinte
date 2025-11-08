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
const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // Auth check
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  try {
    const { bucket, filePath } = await req.json()
    
    if (!bucket || !filePath) {
      return new Response(JSON.stringify({ error: 'Bucket and filePath are required' }), { status: 400, headers: corsHeaders })
    }

    const tenYearsInSeconds = 10 * 365 * 24 * 60 * 60;
    const { data, error } = await supabaseServiceRole.storage
      .from(bucket)
      .createSignedUrl(filePath, tenYearsInSeconds);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    })
  }
})