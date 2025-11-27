import { supabase } from '../lib/supabase'
import { showSuccess, showError } from './toast'

// --- Types for Admin Utilities ---

export interface AdminNotification {
  id: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  related_id: string | null
}

export interface PaymentProof {
  id: string
  seller_id: string
  proof_file_url: string
  amount_paid: number
  status: 'pending' | 'approved' | 'rejected'
  submission_date: string
  reviewed_date: string | null
  store_name: string | null
  email: string
}

// URL base da Edge Function para lidar com o retorno do OAuth
const OAUTH_HANDLER_BASE_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/social-auth'

// URL base da Edge Function para o Content Generator
export const CONTENT_GENERATOR_BASE_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator'

// URL base da Edge Function para o Unsplash Image Generator
export const UNSPLASH_IMAGE_GENERATOR_BASE_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/unsplash-image-generator'

// URL base da Edge Function para o Image Optimizer
export const IMAGE_OPTIMIZER_BASE_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/image-optimizer'


// Credenciais
// Configuração direta para funcionamento imediato conforme solicitado
const FACEBOOK_APP_ID = '705882238650821' 
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '' 

/**
 * Gera a URL de autorização para iniciar o fluxo OAuth.
 * O redirect_uri deve ser a URL da Edge Function.
 */
export const generateOAuthUrl = (platform: 'facebook' | 'google_analytics' | 'google_search_console'): string => {
  
  if (platform === 'facebook') {
    if (!FACEBOOK_APP_ID) {
      showError('Erro: ID do Facebook não configurado.')
      return ''
    }
    
    // A Edge Function usa: https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/social-auth?platform=facebook
    const redirectUri = `${OAUTH_HANDLER_BASE_URL}?platform=facebook`
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    
    // Escopos necessários para gerenciar páginas e publicar conteúdo
    // pages_manage_posts e pages_read_engagement são cruciais
    const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish'
    
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodedRedirectUri}&scope=${scope}&response_type=code`
  }
  
  if (platform === 'google_analytics' || platform === 'google_search_console') {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'MOCK_GOOGLE_ID') {
      showError('Erro: VITE_GOOGLE_CLIENT_ID não configurado no .env.local')
      return ''
    }
    
    const redirectUri = OAUTH_HANDLER_BASE_URL
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    
    const scope = platform === 'google_analytics' 
      ? 'https://www.googleapis.com/auth/analytics.readonly'
      : 'https://www.googleapis.com/auth/webmasters.readonly'
      
    const state = JSON.stringify({ platform })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&scope=${scope}&response_type=code&access_type=offline&state=${encodeURIComponent(state)}`
  }
  
  return ''
}


// --- Notification Functions ---

export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  } catch (error: any) {
    console.error('Error fetching unread notifications count:', error)
    showError('Falha ao buscar contagem de notificações.')
    return 0
  }
}

export const getRecentNotifications = async (): Promise<AdminNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return data as AdminNotification[]
  } catch (error: any) {
    console.error('Error fetching recent notifications:', error)
    showError('Falha ao buscar notificações recentes.')
    return []
  }
}

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    showError('Falha ao marcar notificação como lida.')
    return false
  }
}

// --- Payment Proof Functions ---

export const getPendingPaymentProofs = async (): Promise<PaymentProof[]> => {
  try {
    const { data, error } = await supabase.rpc('get_pending_proofs_with_seller_details')

    if (error) throw error
    return data as PaymentProof[]
  } catch (error: any) {
    console.error('Error fetching pending payment proofs:', error)
    return []
  }
}

export const approvePaymentProof = async (proofId: string, sellerId: string, amountPaid: number): Promise<boolean> => {
  try {
    const { error: proofUpdateError } = await supabase
      .from('seller_payment_proofs')
      .update({ status: 'approved', reviewed_date: new Date().toISOString() })
      .eq('id', proofId)

    if (proofUpdateError) throw proofUpdateError

    const { data: pendingCommissions, error: fetchCommissionsError } = await supabase
      .from('commissions')
      .select('id, amount')
      .eq('seller_id', sellerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      
    if (fetchCommissionsError) throw fetchCommissionsError
    
    let remainingAmount = amountPaid
    const commissionsToPay: string[] = []
    
    for (const commission of pendingCommissions || []) {
      if (remainingAmount >= commission.amount) {
        commissionsToPay.push(commission.id)
        remainingAmount -= commission.amount
      } else {
        break 
      }
    }
    
    if (commissionsToPay.length > 0) {
      const { error: commissionUpdateError } = await supabase
        .from('commissions')
        .update({ status: 'paid' })
        .in('id', commissionsToPay)
        
      if (commissionUpdateError) throw commissionUpdateError
      
      showSuccess(`Aprovado! ${commissionsToPay.length} comissão(ões) marcadas como pagas.`)
    } else {
      showSuccess('Aprovado! Nenhuma comissão pendente encontrada para zerar com este valor.')
    }

    await supabase.from('admin_notifications').insert({
      message: `Comprovante de pagamento #${proofId.slice(0, 8)} do vendedor ${sellerId.slice(0, 8)} APROVADO.`,
      type: 'payment_approved',
      related_id: proofId
    })

    return true
  } catch (error: any) {
    console.error('Error approving payment proof:', error)
    showError('Erro ao aprovar pagamento: ' + error.message)
    return false
  }
}

export const rejectPaymentProof = async (proofId: string, sellerId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('seller_payment_proofs')
      .update({ status: 'rejected', reviewed_date: new Date().toISOString() })
      .eq('id', proofId)

    if (error) throw error
    
    await supabase.from('admin_notifications').insert({
      message: `Comprovante de pagamento #${proofId.slice(0, 8)} do vendedor ${sellerId.slice(0, 8)} REJEITADO.`,
      type: 'payment_rejected',
      related_id: proofId
    })

    showSuccess('Pagamento rejeitado e vendedor notificado (simulado).')
    return true
  } catch (error: any) {
    console.error('Error rejecting payment proof:', error)
    showError('Erro ao rejeitar pagamento: ' + error.message)
    return false
  }
}