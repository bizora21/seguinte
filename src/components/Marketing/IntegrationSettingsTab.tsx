import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Link, Facebook, TrendingUp, CheckCircle, Loader2, RefreshCw, AlertTriangle, Copy, RotateCw, Trash2 } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { generateOAuthUrl } from '../../utils/admin' 
import { useSearchParams, useNavigate } from 'react-router-dom'

interface Integration {
  platform: string
  access_token: string
  metadata: any
  updated_at: string
  expires_at?: string | null
}

const IntegrationSettingsTab = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const processedRef = useRef(false) // Previne execução dupla do React.StrictMode
  
  const CALLBACK_URL = `${window.location.origin}/dashboard/admin/marketing`

  const fetchIntegrations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        
      if (error) throw error
      
      setIntegrations(data as Integration[] || [])
    } catch (error: any) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')
    
    // Se tiver código e ainda não tiver processado
    if (code && stateParam && !processedRef.current) {
      processedRef.current = true; // Marca como processado imediatamente
      handleOAuthCallback(code, stateParam)
    } else if (!code) {
      // Só busca integrações se NÃO estiver processando um callback
      fetchIntegrations()
    }
  }, [searchParams])

  const handleOAuthCallback = async (code: string, stateParam: string) => {
    setSubmitting(true)
    const toastId = showLoading('Conectando ao Facebook...')
    
    try {
      const state = JSON.parse(decodeURIComponent(stateParam))
      const platform = state.platform
      
      // Chamada para a Edge Function
      const { data, error } = await supabase.functions.invoke('social-auth', {
        method: 'POST',
        body: {
          action: 'exchange_token',
          code,
          platform,
          redirect_uri: CALLBACK_URL
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      dismissToast(toastId)
      showSuccess(`Sucesso! Conectado ao ${platform}.`)
      
      // Limpeza agressiva da URL para remover o código usado
      // Usamos window.location para forçar um refresh limpo se necessário,
      // ou navigate com replace para limpar o histórico.
      const newUrl = window.location.pathname + '?tab=social' // Mantém na aba social
      window.history.replaceState({}, document.title, newUrl)
      
      // Recarrega as integrações após um breve delay para garantir que o banco atualizou
      setTimeout(() => {
        fetchIntegrations()
        setSubmitting(false)
      }, 1000)
      
    } catch (error: any) {
      dismissToast(toastId)
      console.error('OAuth Callback Error:', error)
      showError(`Erro ao conectar: ${error.message}`)
      setSubmitting(false)
    }
  }

  // --- NOVA FUNÇÃO PARA SINCRONIZAR PÁGINAS ---
  const handleSyncPages = async () => {
    setSubmitting(true)
    const toastId = showLoading('Buscando suas páginas do Facebook...')
    
    try {
        const { data, error } = await supabase.functions.invoke('social-auth', {
            method: 'POST',
            body: { action: 'fetch_pages' }
        })

        if (error) throw error
        if (data?.error) throw new Error(data.error)
        
        dismissToast(toastId)
        
        if (data.success) {
            showSuccess(`Página "${data.page_name}" configurada com sucesso!`)
            fetchIntegrations()
        } else {
            showError(data.message || 'Nenhuma página encontrada.')
        }

    } catch (error: any) {
        dismissToast(toastId)
        showError(`Erro ao sincronizar: ${error.message}`)
    } finally {
        setSubmitting(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta conta? Isso removerá o token atual.')) return;

    setSubmitting(true);
    const toastId = showLoading('Desconectando...');

    try {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .eq('platform', platform);

        if (error) throw error;

        dismissToast(toastId);
        showSuccess('Conta desconectada com sucesso.');
        setIntegrations(prev => prev.filter(i => i.platform !== platform));
    } catch (error: any) {
        dismissToast(toastId);
        showError('Erro ao desconectar: ' + error.message);
    } finally {
        setSubmitting(false);
    }
  };

  const getIntegrationStatus = (platform: string) => {
    return integrations.find(i => i.platform === platform)
  }

  const handleConnectOAuth = (platform: 'facebook' | 'google_analytics' | 'google_search_console', name: string) => {
    setSubmitting(true)
    try {
      const authUrl = generateOAuthUrl(platform)
      if (!authUrl) {
        setSubmitting(false)
        return
      }
      // Redirecionamento completo
      window.location.href = authUrl
    } catch (error: any) {
      showError('Erro ao iniciar o fluxo de conexão: ' + error.message)
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('URL copiada!')
  }
  
  const integrationList = [
    { platform: 'facebook', name: 'Facebook (Páginas)', icon: <Facebook className="w-6 h-6 text-blue-600" />, description: 'Necessário para automação de posts no Facebook.' },
    { platform: 'google_analytics', name: 'Google Analytics', icon: <TrendingUp className="w-6 h-6 text-orange-600" />, description: 'Monitoramento de tráfego e conversão.' },
  ]

  if (loading) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Link className="w-6 h-6 mr-2" />
            Configurações de Integração (OAuth)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-3">
              <h3 className="font-bold text-blue-800 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Configuração Obrigatória no Facebook Developers</h3>
              <p className="text-blue-700">
                  Certifique-se de que o URL abaixo está adicionado em "Login do Facebook &gt; Configurações &gt; URIs de redirecionamento do OAuth válidos".
              </p>
              <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 rounded border border-blue-200 font-mono text-xs break-all">
                      {CALLBACK_URL}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(CALLBACK_URL)}>
                      <Copy className="w-4 h-4" />
                  </Button>
              </div>
          </div>
          
          <div className="space-y-4">
            {integrationList.map((item) => {
              const status = getIntegrationStatus(item.platform)
              const isConnected = !!status
              const hasPage = status?.metadata?.page_id
              
              return (
                <div key={item.platform} className={`p-4 rounded-lg flex flex-col gap-4 border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <div>
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          {isConnected && (
                            <div className="flex items-center text-xs mt-1 font-medium">
                              {hasPage ? (
                                <span className="text-green-700 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Página: {status.metadata.page_name}</span>
                              ) : (
                                <span className="text-orange-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> ID: Pendente (Nenhuma página detectada)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                          {isConnected && (
                              <Button 
                                onClick={() => handleDisconnect(item.platform)} 
                                disabled={submitting} 
                                variant="destructive"
                                size="icon"
                                className="h-10 w-10"
                                title="Desconectar / Excluir Token"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                          )}

                          {isConnected && !hasPage && item.platform === 'facebook' && (
                              <Button 
                                onClick={handleSyncPages} 
                                disabled={submitting} 
                                variant="secondary"
                                className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                              >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4 mr-2" />}
                                Sincronizar
                              </Button>
                          )}
                          
                          <Button 
                            onClick={() => handleConnectOAuth(item.platform as any, item.name)}
                            disabled={submitting}
                            variant={isConnected ? 'outline' : 'default'}
                            className={isConnected ? 'text-gray-700 border-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isConnected ? 'Reconectar' : 'Conectar Agora'}
                          </Button>
                      </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <Button onClick={fetchIntegrations} variant="ghost" size="sm" className="w-full text-gray-500">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Status de Conexão
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default IntegrationSettingsTab