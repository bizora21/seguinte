// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

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

  // Auth check simplificado para admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

  try {
    const { action } = await req.json()

    // --- ANALISAR GAPS DE MERCADO ---
    if (action === 'analyze_gaps') {
        // 1. Pegar top 50 buscas recentes
        const { data: searchLogs } = await supabaseServiceRole
            .from('search_logs')
            .select('query')
            .order('created_at', { ascending: false })
            .limit(100);

        if (!searchLogs || searchLogs.length === 0) {
            return new Response(JSON.stringify({ success: true, insights: [] }), { headers: corsHeaders });
        }

        // Agrupar e contar buscas (simples frequency count)
        const counts: Record<string, number> = {};
        searchLogs.forEach((log: any) => {
            const term = log.query.toLowerCase().trim();
            counts[term] = (counts[term] || 0) + 1;
        });

        // Ordenar por popularidade
        const topTerms = Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const insights = [];

        // 2. Verificar estoque para cada termo popular
        for (const [term, count] of topTerms) {
            const { count: productCount } = await supabaseServiceRole
                .from('products')
                .select('*', { count: 'exact', head: true })
                .ilike('name', `%${term}%`)
                .gt('stock', 0); // Apenas produtos em estoque

            // Calcular "Índice de Oportunidade"
            // Se muita busca e pouco produto = Oportunidade Alta
            const supply = productCount || 0;
            let status = 'balanced';
            let message = 'Oferta atende a demanda.';
            let actionType = 'none';

            if (supply === 0) {
                status = 'critical';
                message = `ALERTA: Clientes buscam "${term}" mas não há estoque!`;
                actionType = 'recruit';
            } else if (count > supply * 2) {
                status = 'warning';
                message = `Alta demanda por "${term}", estoque baixo (${supply} un).`;
                actionType = 'boost';
            }

            if (status !== 'balanced') {
                insights.push({
                    term,
                    searchVolume: count,
                    supplyCount: supply,
                    status,
                    message,
                    actionType
                });
            }
        }

        return new Response(JSON.stringify({ success: true, insights }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), { status: 400, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 })
  }
})