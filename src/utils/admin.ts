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
  seller: {
    store_name: string | null
    email: string
  }
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
  } catch (error) {
    console.error('Error fetching unread notifications count:', error)
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
  } catch (error) {
    console.error('Error fetching recent notifications:', error)
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
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// --- Payment Proof Functions ---

export const getPendingPaymentProofs = async (): Promise<PaymentProof[]> => {
  try {
    const { data, error } = await supabase
      .from('seller_payment_proofs')
      .select(`
        *,
        seller:profiles!seller_payment_proofs_seller_id_fkey (
          store_name,
          email
        )
      `)
      .eq('status', 'pending')
      .order('submission_date', { ascending: true })

    if (error) throw error
    return data as PaymentProof[]
  } catch (error) {
    console.error('Error fetching pending payment proofs:', error)
    return []
  }
}

// Função para aprovar pagamento e zerar comissões pendentes
export const approvePaymentProof = async (proofId: string, sellerId: string, amountPaid: number): Promise<boolean> => {
  try {
    // 1. Atualizar o status do comprovante para 'approved'
    const { error: proofUpdateError } = await supabase
      .from('seller_payment_proofs')
      .update({ status: 'approved', reviewed_date: new Date().toISOString() })
      .eq('id', proofId)

    if (proofUpdateError) throw proofUpdateError

    // 2. Marcar as comissões pendentes como 'paid' até o valor pago.
    
    // Buscar todas as comissões pendentes do vendedor, ordenadas por data
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
        // Se o pagamento for parcial, paramos aqui.
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

    // 3. Inserir notificação para o administrador sobre a aprovação
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
    
    // Inserir notificação para o administrador sobre a rejeição
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