import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2, CheckCircle, XCircle, Facebook, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'

interface OAuthProcessorProps {
  code: string
  stateParam: string | null
  onComplete: () => void
}

const OAuthProcessor: React.FC<OAuthProcessorProps> = ({ code, stateParam, onComplete }) => {
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

        if (syncError) {
            // Não falha o processo todo se apenas a sincronização falhar
            addLog(`Aviso na sincronização: ${syncError.message}`)
        } else if (syncData?.error) {
            addLog(`Aviso na sincronização: ${syncData.error}`)
        } else if (syncData?.success) {
            addLog(`Página encontrada: ${syncData.page_name}`)
        } else {
            addLog('Nenhuma página encontrada. Token salvo, mas sem página ativa.')
        }
      }

      setStep('success')
      addLog('Conexão finalizada com sucesso!')
      
      // Tenta redirecionar automaticamente após 2 segundos
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

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-blue-600 animate-in zoom-in-95 duration-300 bg-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl flex flex-col items-center gap-4">
            {step === 'error' ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                    <XCircle className="w-10 h-10 text-red-600" />
                </div>
            ) : step === 'success' ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
            ) : (
                <div className="relative">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Facebook className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg border">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                </div>
            )}
            
            <div className="space-y-1">
                <h3 className="font-bold text-gray-900">
                    {step === 'error' ? 'Falha na Conexão' : step === 'success' ? 'Conectado com Sucesso!' : 'Processando Integração...'}
                </h3>
                <p className="text-sm font-normal text-gray-500">
                    {step === 'init' && 'Recebendo autorização...'}
                    {step === 'exchanging' && 'Validando credenciais...'}
                    {step === 'syncing' && 'Sincronizando páginas...'}
                    {step === 'success' && 'Tudo pronto para vender!'}
                    {step === 'error' && 'Ocorreu um erro.'}
                </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Timeline de Progresso */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center gap-3 text-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${step !== 'init' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={step === 'init' ? 'font-bold text-blue-600' : 'text-gray-600'}>1. Recebendo código</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${['syncing', 'success', 'error'].includes(step) ? 'bg-green-500' : step === 'exchanging' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={step === 'exchanging' ? 'font-bold text-blue-600' : 'text-gray-600'}>2. Gerando tokens seguros</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${step === 'success' ? 'bg-green-500' : step === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={step === 'syncing' ? 'font-bold text-blue-600' : 'text-gray-600'}>3. Configurando páginas</span>
            </div>
          </div>

          {/* Área de Logs (Oculta se sucesso para limpar visual, expandir se erro) */}
          {(step === 'error' || step === 'syncing') && (
            <div className="bg-gray-900 rounded-md p-3 text-xs font-mono text-green-400 h-32 overflow-y-auto shadow-inner">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1 border-b border-gray-800 last:border-0 pb-1 opacity-90">{`> ${log}`}</div>
                ))}
                {errorDetails && (
                    <div className="text-red-400 font-bold mt-2 border-t border-red-900 pt-2">{`ERROR: ${errorDetails}`}</div>
                )}
            </div>
          )}

          {step === 'error' && (
            <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                    Tentar Novamente
                </Button>
                <Button onClick={onComplete} variant="ghost" className="flex-1">
                    Cancelar
                </Button>
            </div>
          )}
          
          {step === 'success' && (
            <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-lg animate-pulse">
                Concluir e Voltar ao Painel <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}

        </CardContent>
      </Card>
    </div>
  )
}

export default OAuthProcessor