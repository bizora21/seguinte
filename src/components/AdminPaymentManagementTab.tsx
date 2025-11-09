import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Receipt, CheckCircle, XCircle, ExternalLink, Store, Clock, DollarSign } from 'lucide-react'
import { getPendingPaymentProofs, approvePaymentProof, rejectPaymentProof, PaymentProof } from '../utils/admin'
import LoadingSpinner from './LoadingSpinner'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { supabase } from '../lib/supabase' // Importar supabase

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

    // 🔥 NOVO: Configurar subscrição em tempo real
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
          console.log('Realtime: Novo comprovativo de pagamento recebido!', payload)
          showSuccess('Novo comprovativo de pagamento recebido!')
          fetchProofs() // Recarrega a lista
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchProofs])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const handleApprove = async (proof: PaymentProof) => {
    setProcessingId(proof.id)
    const toastId = showLoading('Aprovando pagamento...')
    const success = await approvePaymentProof(proof.id, proof.seller_id, proof.amount_paid)
    dismissToast(toastId)
    if (success) {
      fetchProofs()
    }
    setProcessingId(null)
  }

  const handleReject = async (proof: PaymentProof) => {
    setProcessingId(proof.id)
    const toastId = showLoading('Rejeitando pagamento...')
    const success = await rejectPaymentProof(proof.id, proof.seller_id)
    dismissToast(toastId)
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
          Gestão de Pagamentos de Vendedores ({pendingProofs.length})
        </CardTitle>
        <Button onClick={fetchProofs} variant="outline">
          <Clock className="w-4 h-4 mr-2" />
          Atualizar Lista
        </Button>
      </CardHeader>
      <CardContent>
        {pendingProofs.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum comprovante pendente
            </h2>
            <p className="text-gray-600">
              Todos os pagamentos de comissão foram revisados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProofs.map((proof) => (
                  <TableRow key={proof.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Store className="w-4 h-4 text-gray-600" />
                        {/* CORREÇÃO: Acessando as propriedades planas */}
                        <span>{proof.store_name || proof.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatPrice(proof.amount_paid)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDate(proof.submission_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ver Imagem
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-4">
                          <h3 className="text-lg font-semibold mb-2">Comprovante de Pagamento</h3>
                          <img 
                            src={proof.proof_file_url} 
                            alt={`Comprovante de ${proof.store_name}`} 
                            className="w-full h-auto object-contain max-h-[80vh]"
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        onClick={() => handleApprove(proof)}
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={processingId === proof.id}
                      >
                        {processingId === proof.id ? <LoadingSpinner size="sm" className="mr-2 border-t-white" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleReject(proof)}
                        variant="destructive"
                        size="sm"
                        disabled={processingId === proof.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AdminPaymentManagementTab