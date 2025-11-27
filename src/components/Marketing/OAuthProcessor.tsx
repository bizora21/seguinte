import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2, CheckCircle, XCircle, Facebook } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'

interface OAuthProcessorProps {
  code: string
  stateParam: string | null
  onComplete: () => void
}

const OAuthProcessor: React.FC<OAuthProcessorProps> = ({ code, stateParam, onComplete }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'init' | 'exchanging' | 'syncing' | 'success' | 'error'>('init')
  const [logs, setLogs] = useState<string[]>([])
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const processedRef = useRef(false)

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true
    
    processOAuth()
  }, [])

  const processOAuth = async () => {
    try {
      setStep('exchanging')
      addLog('Iniciando troca de token seguro...')
      
      // Determinar plataforma
      let platform = 'facebook'
      try {
        if (stateParam) {
            const state = JSON.parse(decodeURIComponent(stateParam))
            if (state.platform) platform = state.platform
        }
      } catch (e) {
        addLog('Aviso: State inválido, assumindo Facebook.')
      }

      // IMPORTANTE: A URL de callback deve ser EXATAMENTE a mesma usada para gerar o link
      const CALLBACK_URL = `${window.location.origin}/dashboard/admin/marketing`

      // 1. Trocar Code por Token
      const { data: authData, error: authError } = await supabase.functions.invoke('social-auth', {
        method: 'POST',
        body: {
          action: 'exchange_token',
          code,
          platform,
          redirect_uri: CALLBACK_URL
        }
      })

      if (authError) throw authError
      if (authData?.error) throw new Error(authData.error)
      
      addLog('Token de acesso obtido e salvo com sucesso.')
      
      // 2. Sincronizar Páginas (Se for Facebook)
      if (platform === 'facebook') {
        setStep('syncing')
        addLog('Buscando páginas vinculadas à conta...')
        
        const { data: syncData, error: syncError } = await supabase.functions.invoke('social-auth', {
            method: 'POST',
            body: { action: 'fetch_pages' }
        })

        if (syncError) throw syncError
        if (syncData?.error) throw new Error(syncData.error)
        
        if (syncData.success) {
            addLog(`Página encontrada: ${syncData.page_name}`)
        } else {
            addLog('Nenhuma página encontrada. Token salvo, mas sem página ativa.')
        }
      }

      setStep('success')
      addLog('Conexão finalizada!')
      
      // Aguardar brevemente para usuário ver o sucesso
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (error: any) {
      console.error('OAuth Error:', error)
      setStep('error')
      setErrorDetails(error.message || 'Erro desconhecido')
      addLog(`FALHA CRÍTICA: ${error.message}`)
    }
  }

  const handleRetry = () => {
    // Limpar URL e recarregar
    navigate('/dashboard/admin/marketing?tab=settings', { replace: true })
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-blue-600 animate-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl flex flex-col items-center gap-2">
            {step === 'error' ? (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                    <XCircle className="w-8 h-8 text-red-600" />
                </div>
            ) : step === 'success' ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
            ) : (
                <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                </div>
            )}
            
            {step === 'error' ? 'Falha na Conexão' : step === 'success' ? 'Conectado!' : 'Conectando ao Facebook...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Timeline de Progresso */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${step !== 'init' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={step === 'init' ? 'font-bold text-blue-600' : 'text-gray-600'}>Recebendo código de autorização</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${['syncing', 'success', 'error'].includes(step) ? 'bg-green-500' : step === 'exchanging' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={step === 'exchanging' ? 'font-bold text-blue-600' : 'text-gray-600'}>Validando credenciais de segurança</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${step === 'success' ? 'bg-green-500' : step === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={step === 'syncing' ? 'font-bold text-blue-600' : 'text-gray-600'}>Sincronizando Páginas do Facebook</span>
            </div>
          </div>

          {/* Área de Logs/Erro */}
          <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-600 border h-32 overflow-y-auto">
            {logs.map((log, i) => (
                <div key={i} className="mb-1 border-b border-gray-100 last:border-0 pb-1">{`> ${log}`}</div>
            ))}
            {errorDetails && (
                <div className="text-red-600 font-bold mt-2">{`ERROR: ${errorDetails}`}</div>
            )}
          </div>

          {step === 'error' && (
            <Button onClick={handleRetry} className="w-full bg-red-600 hover:bg-red-700">
                Tentar Novamente
            </Button>
          )}
          
          {step === 'success' && (
            <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                Redirecionando...
            </Button>
          )}

        </CardContent>
      </Card>
    </div>
  )
}

export default OAuthProcessor