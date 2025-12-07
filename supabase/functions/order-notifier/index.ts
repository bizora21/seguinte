// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Cliente Supabase com Service Role Key para ignorar RLS e garantir acesso aos dados
const supabaseServiceRole = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// @ts-ignore
const log = (message: string, data?: any) => {
  console.log(`[ORDER-NOTIFIER] ${message}`, data || '');
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // --- AUTHENTICATION (Service Role Key Check) ---
  // Esta função deve ser chamada APENAS pelo trigger do banco de dados (que usa a Service Role Key)
  const authHeader = req.headers.get('Authorization')
  // @ts-ignore
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!authHeader || authHeader.replace('Bearer ', '') !== serviceRoleKey) {
    log("Authentication failed: Invalid or missing Service Role Key.");
    return new Response(JSON.stringify({ error: 'Unauthorized: Service Role Key required' }), { status: 401, headers: corsHeaders })
  }
  // --- END AUTHENTICATION ---

  try {
    const { order_id } = await req.json()
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Order ID missing' }), { status: 400, headers: corsHeaders })
    }
    log(`Processing order: ${order_id}`);

    // 1. Buscar detalhes do pedido, itens e vendedor (usando Service Role)
    const { data: order, error: orderError } = await supabaseServiceRole
      .from('orders')
      .select(`
        id, total_amount, customer_name, user_id,
        order_items (
          quantity, price, product_id, seller_id,
          product:products ( name )
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      log("Error fetching order details:", orderError);
      throw new Error('Order not found or DB error: ' + orderError?.message);
    }
    
    // 2. Identificar o vendedor principal (assumindo que todos os itens são do mesmo vendedor para simplificar a notificação)
    const sellerId = order.order_items[0]?.seller_id;
    if (!sellerId) {
        log("Warning: Seller ID not found for order items.");
        return new Response(JSON.stringify({ success: true, message: 'No seller found, skipping email.' }), { headers: corsHeaders });
    }
    
    // 3. Buscar detalhes do vendedor
    const { data: sellerProfile, error: sellerError } = await supabaseServiceRole
        .from('profiles')
        .select('email, store_name')
        .eq('id', sellerId)
        .single()
        
    if (sellerError || !sellerProfile?.email) {
        log("Error fetching seller profile or email:", sellerError);
        throw new Error('Seller profile not found or missing email.');
    }

    const sellerEmail = sellerProfile.email;
    const sellerStoreName = sellerProfile.store_name || sellerEmail.split('@')[0];
    const productCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmountFormatted = new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(order.total_amount);
    
    // 4. Gerar HTML (usando o template que estava no PL/pgSQL)
    const emailHtml = `
        <h1>🎉 Novo Pedido Recebido!</h1>
        <p>Parabéns, ${sellerStoreName}!</p>
        <p>Você recebeu um novo pedido na sua loja LojaRápida.</p>
        <div style="background-color: #e6fff5; padding: 15px; border-radius: 8px;">
            <p style="font-weight: bold; margin: 0;">Pedido #${order.id.slice(0, 8)}</p>
            <p style="margin: 5px 0 0 0;">Valor Total: <strong>${totalAmountFormatted}</strong></p>
            <p style="margin: 5px 0 0 0;">Itens: ${productCount} produto(s)</p>
        </div>
        <p>Acesse seu dashboard para ver os detalhes do cliente e atualizar o status para "Em Preparação".</p>
        <div style="text-align: center; margin-top: 20px;">
            <a href="https://lojarapidamz.com/meus-pedidos" style="background-color: #0A2540; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Ver Pedido e Atualizar Status
            </a>
        </div>
    `;

    // 5. Chamar a Edge Function email-sender
    const emailResponse = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/email-sender', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
            to: sellerEmail,
            subject: `🎉 NOVO PEDIDO RECEBIDO! #${order.id.slice(0, 8)} - ${totalAmountFormatted}`,
            html: emailHtml
        })
    });
    
    const emailData = await emailResponse.json();
    if (!emailResponse.ok || emailData.error) {
        log("Email sender failed:", emailData);
        throw new Error(emailData.error || 'Email sender failed.');
    }

    log("Email sent successfully to seller.");
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 })

  } catch (error) {
    log("Edge Function execution error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { headers: corsHeaders, status: 500 })
  }
})