import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2, CheckCircle, XCircle, Facebook, ArrowRight, ShieldAlert, Home } from 'lucide-react'
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

  // Timer de segurança para mostrar botão de saída se demorar muito
  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true
    
    const execute = async () => {
      try {
        addLog('Iniciando processamento seguro (v2.0)...')
        
        // 1. Determinar plataforma
        let platform = 'facebook'
        try {
          if (stateParam) {
              const state = JSON.parse(decodeURIComponent(stateParam))
              if (state.platform) platform = state.platform
          }
        } catch (e) {
          addLog('Aviso: State ausente ou inválido. Usando padrão (Facebook).')
        }

        const CALLBACK_URL = `${window.location.origin}/dashboard/admin/marketing`
        addLog(`Callback URL: ${CALLBACK_URL}`)

        // 2. Chamada à Edge Function
        addLog('Trocando código por token de acesso...')
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
        
        addLog('Token obtido com sucesso.')
        
        // 3. Sincronização de Páginas (apenas para Facebook)
        if (platform === 'facebook') {
          addLog('Buscando páginas do Facebook...')
          const { data: syncData, error: syncError } = await supabase.functions.invoke('social-auth', {
              method: 'POST',
              body: { action: 'fetch_pages' }
          })

          if (syncError) {
              addLog(`Aviso (Sync): ${syncError.message}`)
          } else if (syncData?.success) {
              addLog(`Página vinculada: ${syncData.page_name}`)
          } else {
              addLog('Nenhuma página encontrada. Token salvo.')
          }
        }

        setStatus('success')
        addLog('Processo concluído com êxito!')
        
        // Auto-concluir após 2s
        setTimeout(() => {
          onComplete()
        }, 2000)

      } catch (error: any) {
        console.error('OAuth Fatal Error:', error)
        setStatus('error')
        setErrorDetails(error.message || 'Erro desconhecido')
        addLog(`ERRO FATAL: ${error.message}`)
      }
    }

    execute()
  }, [code, stateParam, onComplete])

  return (
    <div className="fixed inset-0 bg-slate-900 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className={`text-center pb-6 border-b ${status === 'success' ? 'bg-green-50' : status === 'error' ? 'bg-red-50' : 'bg-white'}`}>
          <div className="mx-auto mb-4">
            {status === 'processing' && (
                <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <Facebook className="absolute inset-0 m-auto text-blue-600 w-8 h-8" />
                </div>
            )}
            {status === 'success' && <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce"><CheckCircle className="w-10 h-10 text-green-600" /></div>}
            {status === 'error' && <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse"><XCircle className="w-10 h-10 text-red-600" /></div>}
          </div>
          
          <CardTitle className="text-2xl">
            {status === 'processing' ? 'Conectando...' : status === 'success' ? 'Conexão Estabelecida!' : 'Falha na Conexão'}
          </CardTitle>
          <p className="text-gray-500 mt-2">
            {status === 'processing' ? 'Estamos configurando a integração segura.' : status === 'success' ? 'Sua conta foi vinculada com sucesso.' : 'Ocorreu um erro durante o processo.'}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          
          {/* Console de Logs */}
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto border border-slate-800 shadow-inner">
            {logs.map((log, i) => (
                <div key={i} className="mb-1.5 border-b border-slate-900/50 pb-1 last:border-0 opacity-90">{`> ${log}`}</div>
            ))}
            {status === 'processing' && (
                <div className="animate-pulse mt-2">{`> Aguardando resposta (${timer}s)...`}</div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            {status === 'success' && (
                <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-lg">
                    Voltar ao Painel <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            )}

            {status === 'error' && (
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Tentar Novamente
                    </Button>
                    <Button onClick={onComplete} variant="destructive">
                        Cancelar
                    </Button>
                </div>
            )}

            {/* Botão de Emergência se demorar muito */}
            {status === 'processing' && timer > 10 && (
                <div className="pt-2 animate-in fade-in duration-500">
                    <div className="flex items-center justify-center text-yellow-600 text-xs mb-2">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Está demorando mais que o normal?
                    </div>
                    <Button onClick={onComplete} variant="secondary" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                        Pular e Voltar ao Painel
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