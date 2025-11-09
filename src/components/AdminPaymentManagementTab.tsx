import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Receipt, CheckCircle, XCircle, ExternalLink, Store, Clock, DollarSign, RefreshCw } from 'lucide-react'
import { getPendingPaymentProofs, approvePaymentProof, rejectPaymentProof, PaymentProof } from '../utils/admin'
import LoadingSpinner from './LoadingSpinner'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { supabase } from '../lib/supabase'
import { showSuccess } from '../utils/toast'

const AdminPaymentManagementTab = () => {
  const [pendingProofs, setPendingProofs] = useState<PaymentProof[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchProofs = useCallback(async () => {
    setLoading(true)
    const proofs = await getPendingPaymentProofs()
    setPendingProofs(proofs)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProofs()

    const channel = supabase
      .channel('admin_payment_proofs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
          filter: 'type=eq.payment_proof_submitted'
        },
        (payload) => {
          showSuccess('Novo comprovativo de pagamento recebido!')
          fetchProofs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchProofs])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))
  }

  const handleApprove = async (proof: PaymentProof) => {
    setProcessingId(proof.id)
    const success = await approvePaymentProof(proof.id, proof.seller_id, proof.amount_paid)
    if (success) {
      fetchProofs()
    }
    setProcessingId(null)
  }

  const handleReject = async (proof: PaymentProof) => {
    setProcessingId(proof.id)
    const success = await rejectPaymentProof(proof.id, proof.seller_id)
    if (success) {
      fetchProofs()
    }
    setProcessingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-xl">
          <Receipt className="w-6 h-6 mr-2 text-blue-600" />
          Verificação de Pagamentos ({pendingProofs.length})
        </CardTitle>
        <Button onClick={fetchProofs} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {pendingProofs.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum comprovante pendente</h2>
            <p className="text-gray-600">Todos os pagamentos de comissão foram revisados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProofs.map((proof) => (
              <div key={proof.id} className="p-4 border rounded-lg bg-blue-50 flex flex-col sm:flex-row gap-4">
                {/* Informações do Vendedor */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center font-medium text-blue-900">
                    <Store className="w-4 h-4 mr-2" />
                    <span>{proof.store_name || proof.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>Valor Pago: <span className="font-bold text-green-600">{formatPrice(proof.amount_paid)}</span></span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Enviado em: {formatDate(proof.submission_date)}</span>
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <ExternalLink className="w-4 h-4 mr-1" /> Ver Comprovante
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-4">
                      <img src={proof.proof_file_url} alt={`Comprovante de ${proof.store_name}`} className="w-full h-auto object-contain max-h-[80vh]" />
                    </DialogContent>
                  </Dialog>
                  <div className="flex gap-2">
                    <Button onClick={() => handleReject(proof)} variant="destructive" className="flex-1" disabled={processingId === proof.id}>
                      <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                    <Button onClick={() => handleApprove(proof)} className="flex-1 bg-green-600 hover:bg-green-700" disabled={processingId === proof.id}>
                      {processingId === proof.id ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                      Aprovar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AdminPaymentManagementTab