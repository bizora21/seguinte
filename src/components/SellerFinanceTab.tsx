import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DollarSign, Phone, CheckCheck, Upload, FileText, X, TrendingUp } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useDropzone } from 'react-dropzone'

interface Commission {
  id: string
  order_id: string
  amount: number
  status: 'pending' | 'paid'
  created_at: string
  payment_method?: string | null
  admin_payment_reference?: string | null
  order: {
    id: string
    total_amount: number
  }
}

const SellerFinanceTab = () => {
  const { user } = useAuth()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [totalOwed, setTotalOwed] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [file, setFile] = useState<File | null>(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const PAYMENT_PHONE = '846843135'

  useEffect(() => {
    if (user) {
      fetchCommissions()
    }
  }, [user])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          order:orders (
            id,
            total_amount
          )
        `)
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCommissions(data || [])
      
      const owed = data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0
      setTotalOwed(owed)

    } catch (error: any) {
      console.error('Error fetching commissions:', error)
      showError('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const uploadProofAndSubmit = async () => {
    if (!file || !user) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`
    // O caminho agora inclui o ID do usuário como uma pasta para corresponder à política de RLS
    const filePath = `${user.id}/${fileName}`
    
    const toastId = showLoading('Fazendo upload do comprovante...')

    try {
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)
        
      const proofUrl = publicUrlData.publicUrl

      const { data: proofRecord, error: insertError } = await supabase
        .from('seller_payment_proofs')
        .insert({
          seller_id: user.id,
          proof_file_url: proofUrl,
          amount_paid: parseFloat(amountPaid),
          status: 'pending'
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // 🔥 NOVO: Gerar notificação para o admin
      await supabase.from('admin_notifications').insert({
        message: `O vendedor ${user.profile?.store_name || user.email} enviou um comprovativo de ${formatPrice(parseFloat(amountPaid))}.`,
        type: 'payment_proof_submitted',
        related_id: proofRecord.id
      })

      dismissToast(toastId)
      showSuccess('Comprovante enviado! O administrador irá verificar e aprovar o pagamento.')
      
      setFile(null)
      setAmountPaid('')
      fetchCommissions()

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao enviar comprovante: ' + error.message)
      console.error('Payment proof error:', error)
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleSendPaymentProof = async () => {
    if (!file) {
      showError('Por favor, anexe o comprovante de pagamento.')
      return
    }
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      showError('Informe o valor pago.')
      return
    }
    if (parseFloat(amountPaid) > totalOwed * 1.1 && totalOwed > 0) {
        showError('O valor pago parece ser muito superior ao saldo devedor. Verifique o valor.')
        return
    }

    setSubmittingPayment(true)
    await uploadProofAndSubmit()
  }
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        showError('Apenas imagens (JPG, PNG) ou PDF são aceitos.')
        return
      }
      setFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: submittingPayment || totalOwed <= 0
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">Saldo Devedor</p>
              <p className="text-3xl font-bold text-orange-600">{formatPrice(totalOwed)}</p>
              <p className="text-xs text-orange-600 mt-2">Comissões pendentes de pagamento</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">Total Pago</p>
              <p className="text-3xl font-bold text-green-600">
                {formatPrice(commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0))}
              </p>
              <p className="text-xs text-green-600 mt-2">Comissões já pagas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Pagar Comissões Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-2">
                Total a Pagar: <span className="text-lg font-bold">{formatPrice(totalOwed)}</span>
              </p>
              <p className="text-sm text-red-700">
                Efetue o pagamento para o número: <strong className="text-red-900">{PAYMENT_PHONE}</strong> (M-Pesa, eMola ou Conta Bancária).
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendPaymentProof() }} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Valor Pago (MZN) *</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Ex: 1500.00"
                  disabled={submittingPayment || totalOwed <= 0}
                />
              </div>

              <div className="space-y-2">
                <Label>Anexar Comprovante (Imagem ou PDF) *</Label>
                <div
                  {...getRootProps()}
                  className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  } ${submittingPayment || totalOwed <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <FileText className="w-5 h-5" />
                      <p className="font-medium">{file.name}</p>
                      <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Arraste e solte o arquivo aqui, ou clique para selecionar.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max: 5MB. Formatos: JPG, PNG, PDF.
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={submittingPayment || totalOwed <= 0 || !file || !amountPaid}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {submittingPayment ? 'Enviando...' : 'Enviar Comprovante para Revisão'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Histórico de Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Você ainda não tem comissões registradas.</p>
              <p className="text-sm text-gray-500 mt-2">As comissões são geradas quando seus pedidos são confirmados pelo administrador.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{formatPrice(commission.amount)}</p>
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Pedido #{commission.order.id.slice(0, 8)} • Total: {formatPrice(commission.order.total_amount)}
                    </p>
                    {(commission.payment_method || commission.admin_payment_reference) && (
                      <p className="text-xs text-blue-600 mt-1">
                        Comprovante: {commission.payment_method} ({commission.admin_payment_reference})
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Gerado em {new Date(commission.created_at).toLocaleDateString('pt-MZ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SellerFinanceTab