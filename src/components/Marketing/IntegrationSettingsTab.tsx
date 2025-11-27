import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Link, Facebook, TrendingUp, CheckCircle, Loader2, RefreshCw, AlertTriangle, Copy, Trash2, Calendar, ShieldCheck, Database, Info, Activity } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { generateOAuthUrl } from '../../utils/admin' 
import { Badge } from '../ui/badge'

interface Integration {
  platform: string
  access_token: string
  metadata: any
  updated_at: string
  expires_at?: string | null
}

const IntegrationSettingsTab = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // URL exata que o Facebook vai usar para retornar (NOVA)
  const CALLBACK_URL = `${window.location.origin}/oauth-callback`

  const fetchIntegrations = async () => {
    setLoading(true)
    try {
      console.log("Buscando integrações...")
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        
      if (error) {
        console.error('Erro Supabase:', error)
        throw error
      }
      
      console.log("Integrações encontradas:", data)
      setIntegrations(data as Integration[] || [])
    } catch (error: any) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchIntegrations()
    
    const handleOAuthSuccess = () => {
        console.log("Evento oauth-success recebido! Atualizando lista...")
        setTimeout(fetchIntegrations, 1500) // Delay um pouco maior para garantir a propagação no DB
    }
    
    window.addEventListener('oauth-success', handleOAuthSuccess)
    return () => window.removeEventListener('oauth-success', handleOAuthSuccess)
  }, [])

  const handleTestConnection = async () => {
      const toastId = showLoading('Testando comunicação com o servidor...');
      try {
          const { data, error } = await supabase.functions.invoke('social-auth', {
              method: 'POST',
              body: { action: 'ping' }
          });
          
          dismissToast(toastId);
          
          if (error) throw error;
          
          if (data && data.success) {
              showSuccess(`Sucesso! Servidor respondeu: "${data.message}". Logs gravados.`);
          } else {
              showError('Servidor respondeu, mas indicou falha.');
          }
      } catch (error: any) {
          dismissToast(toastId);
          showError(`Falha de rede: ${error.message}`);
          console.error("Ping error:", error);
      }
  }

  const handleSyncPages = async () => {
    setSubmitting(true)
    const toastId = showLoading('Verificando conexão com Facebook...')
    try {
        const { data, error } = await supabase.functions.invoke('social-auth', {
            method: 'POST',
            body: { action: 'get_connected_pages' }
        })
        
        dismissToast(toastId)
        
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        
        if (data.success && data.pages) {
            showSuccess(`${data.pages.length} página(s) encontrada(s) e sincronizada(s)!`)
            fetchIntegrations()
        } else {
            showError('Conexão ativa, mas nenhuma página encontrada.')
        }
    } catch (error: any) {
        dismissToast(toastId)
        showError(`Erro de sincronização: ${error.message}`)
    } finally {
        setSubmitting(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!confirm('Tem certeza que deseja desconectar? Isso impedirá novas publicações.')) return;
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
    const integration = integrations.find(i => i.platform === platform)
    if (!integration) return null
    return integration
  }

  const isPending = (integration: Integration | null) => {
      return integration?.access_token === 'PENDENTE_DE_CONEXAO';
  }

  const handleConnectOAuth = (platform: 'facebook' | 'google_analytics' | 'google_search_console') => {
    const current = getIntegrationStatus(platform === 'facebook' ? 'facebook' : platform);
    if (current && !isPending(current)) {
        if (!confirm('Esta conta já parece conectada. Deseja reconectar para renovar o token?')) return;
    }

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
      showError('Erro ao iniciar conexão: ' + error.message)
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('URL copiada para a área de transferência!')
  }
  
  const formatDate = (dateStr?: string | null) => {
      if (!dateStr) return 'N/A'
      return new Date(dateStr).toLocaleDateString('pt-MZ')
  }

  if (loading) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const fbIntegration = getIntegrationStatus('facebook');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-xl text-gray-800">
            <Link className="w-6 h-6 mr-2 text-primary" />
            Central de Integrações
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleTestConnection} variant="outline" size="sm" title="Testar servidor de logs">
                <Activity className="w-4 h-4 mr-2 text-blue-600" /> Diagnóstico de Rede
            </Button>
            <Button onClick={fetchIntegrations} variant="ghost" size="sm" title="Recarregar dados">
                <RefreshCw className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          
          {/* Instruções de Configuração */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-3 shadow-sm">
              <h3 className="font-bold text-amber-800 flex items-center"><Info className="w-4 h-4 mr-2" /> AÇÃO NECESSÁRIA NO FACEBOOK</h3>
              <p className="text-amber-700">
                  A rota de callback mudou para maior estabilidade. Copie a URL abaixo e adicione em:
                  <br/><strong> "Login do Facebook" &gt; "Configurações" &gt; "URIs de Redirecionamento do OAuth Válidos"</strong>.
              </p>
              <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-3 rounded border border-amber-200 font-mono text-xs break-all text-gray-700 select-all font-bold">
                      {CALLBACK_URL}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(CALLBACK_URL)} title="Copiar URL">
                      <Copy className="w-4 h-4" />
                  </Button>
              </div>
          </div>
          
          {/* Integração Facebook */}
          <div className={`border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${fbIntegration ? 'ring-1 ring-green-500 border-green-500' : 'hover:border-blue-300'}`}>
            <div className="bg-gray-50 p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-[#1877F2] p-2.5 rounded-lg text-white shadow-sm">
                        <Facebook className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Facebook & Instagram</h3>
                        <p className="text-sm text-gray-500">Postagem automática de produtos</p>
                    </div>
                </div>
                {fbIntegration ? (
                    isPending(fbIntegration) ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1 text-sm font-bold flex items-center">
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> AGUARDANDO CONEXÃO
                        </Badge>
                    ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-3 py-1 text-sm font-bold flex items-center shadow-sm">
                            <CheckCircle className="w-4 h-4 mr-1.5" /> CONECTADO
                        </Badge>
                    )
                ) : (
                    <Badge variant="outline" className="text-gray-500 bg-white">Não Conectado</Badge>
                )}
            </div>
            
            <div className="p-6 bg-white">
                {fbIntegration && !isPending(fbIntegration) ? (
                    <div className="space-y-6">
                        {/* Detalhes da Conexão */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Página Padrão</span>
                                <div className="font-bold text-gray-900 mt-1 flex items-center text-lg">
                                    {fbIntegration.metadata?.page_name || <span className="text-orange-600 text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Definir na Publicação</span>}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID do Usuário</span>
                                <div className="font-mono text-sm text-gray-700 mt-1 truncate">
                                    {fbIntegration.metadata?.user_id || '-'}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Token Expira em
                                </span>
                                <div className="font-medium text-gray-900 mt-1">
                                    {formatDate(fbIntegration.expires_at)}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Conectado em
                                </span>
                                <div className="font-medium text-gray-900 mt-1">
                                    {formatDate(fbIntegration.updated_at)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button 
                                onClick={handleSyncPages} 
                                disabled={submitting} 
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${submitting ? 'animate-spin' : ''}`} />
                                Testar Conexão e Listar Páginas
                            </Button>
                            <Button 
                                onClick={() => handleDisconnect('facebook')} 
                                disabled={submitting} 
                                variant="destructive"
                                className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Desconectar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 px-4">
                        {isPending(fbIntegration) && (
                            <p className="text-yellow-600 mb-4 font-medium flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Detectamos um registro de teste. Por favor, conecte novamente para ativar.
                            </p>
                        )}
                        <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                            Conecte sua conta para permitir que a LojaRápida publique produtos automaticamente na sua Página do Facebook e Instagram.
                        </p>
                        <Button 
                            onClick={() => handleConnectOAuth('facebook')}
                            disabled={submitting}
                            size="lg"
                            className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-8 h-12 shadow-lg transition-all hover:scale-105 transform active:scale-95"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Facebook className="w-5 h-5 mr-2" />}
                            {isPending(fbIntegration) ? 'Reconectar Facebook Agora' : 'Conectar Facebook Agora'}
                        </Button>
                    </div>
                )}
            </div>
          </div>
          
          <div className="text-center pt-4">
             <p className="text-xs text-gray-400">Ambiente Seguro • Dados Criptografados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default IntegrationSettingsTab