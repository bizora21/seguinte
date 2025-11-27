import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2, CheckCircle, XCircle, Facebook, ArrowRight, ShieldAlert, Bug } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'

interface OAuthCallbackModalProps {
  code: string
  stateParam: string | null
  onComplete: () => void
}

const OAuthCallbackModal: React.FC<OAuthCallbackModalProps> = ({ code, stateParam, onComplete }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [logs, setLogs] = useState<string[]>([])
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const processedRef = useRef(false)
  const [timer, setTimer] = useState(0)

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true
    
    const execute = async () => {
      try {
        addLog('Iniciando processamento (Diagnóstico Ativo)...')
        
        let platform = 'facebook'
        try {
          if (stateParam) {
              const state = JSON.parse(decodeURIComponent(stateParam))
              if (state.platform) platform = state.platform
          }
        } catch (e) {
          addLog('Aviso: State inválido. Usando Facebook.')
        }

        // Determinar a URL exata usada no redirecionamento
        // Importante: Deve ser IDÊNTICA à usada no generateOAuthUrl
        const origin = window.location.origin.replace(/\/$/, '')
        const CALLBACK_URL = `${origin}/dashboard/admin/marketing`
        
        addLog(`Callback URL: ${CALLBACK_URL}`)
        addLog(`Code recebido (início): ${code.substring(0, 10)}...`)

        const { data: authData, error: authError } = await supabase.functions.invoke('social-auth', {
          method: 'POST',
          body: {
            action: 'exchange_token',
            code,
            platform,
            redirect_uri: CALLBACK_URL
          }
        })

        if (authError) {
            throw new Error(`Erro na chamada da função: ${authError.message}`)
        }

        if (authData?.error) {
            // Se a função retornou um erro estruturado (ex: do Facebook)
            console.error('Erro da Edge Function:', authData)
            const detailMsg = typeof authData.details === 'object' ? JSON.stringify(authData.details) : authData.details;
            throw new Error(`${authData.error} ${detailMsg ? `| Detalhes: ${detailMsg}` : ''}`)
        }
        
        addLog('Token trocado com sucesso!')
        
        if (platform === 'facebook') {
          addLog('Sincronizando páginas...')
          const { data: syncData } = await supabase.functions.invoke('social-auth', {
              method: 'POST',
              body: { action: 'fetch_pages' }
          })
          if (syncData?.success) {
              addLog(`Página vinculada: ${syncData.page_name}`)
          }
        }

        setStatus('success')
        addLog('Concluído!')
        
        setTimeout(() => {
          onComplete()
        }, 2000)

      } catch (error: any) {
        console.error('OAuth Fatal Error:', error)
        setStatus('error')
        setErrorDetails(error.message || 'Erro desconhecido')
        addLog(`FALHA: ${error.message}`)
      }
    }

    execute()
  }, [code, stateParam, onComplete])

  return (
    <div className="fixed inset-0 bg-slate-900 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardHeader className={`text-center pb-6 border-b ${status === 'success' ? 'bg-green-50' : status === 'error' ? 'bg-red-50' : 'bg-white'}`}>
          <div className="mx-auto mb-4">
            {status === 'processing' && <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />}
            {status === 'success' && <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />}
            {status === 'error' && <XCircle className="w-12 h-12 text-red-600 mx-auto" />}
          </div>
          
          <CardTitle className="text-2xl">
            {status === 'processing' ? 'Conectando...' : status === 'success' ? 'Sucesso!' : 'Erro na Conexão'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-6">
          
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto border border-slate-800">
            {logs.map((log, i) => (
                <div key={i} className="mb-1">{`> ${log}`}</div>
            ))}
          </div>

          {status === 'error' && (
            <div className="bg-red-100 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
                <div className="font-bold flex items-center mb-2"><Bug className="w-4 h-4 mr-2"/> Detalhes do Erro:</div>
                <div className="break-words font-mono">{errorDetails}</div>
            </div>
          )}

          <div className="space-y-3">
            {status === 'success' && (
                <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
                    Voltar ao Painel
                </Button>
            )}

            {status === 'error' && (
                <div className="flex gap-3">
                    <Button onClick={() => window.location.href = window.location.origin + '/dashboard/admin/marketing?tab=settings'} variant="outline" className="flex-1">
                        Tentar Novamente
                    </Button>
                    <Button onClick={onComplete} variant="destructive" className="flex-1">
                        Fechar
                    </Button>
                </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

export default OAuthCallbackModal