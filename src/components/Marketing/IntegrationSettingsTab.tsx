import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Link, Facebook, TrendingUp, CheckCircle, Loader2, RefreshCw, AlertTriangle, Copy, Trash2, Calendar, ShieldCheck } from 'lucide-react'
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
    fetchIntegrations()
  }, [])

  const handleSyncPages = async () => {
    setSubmitting(true)
    const toastId = showLoading('Sincronizando páginas do Facebook...')
    try {
        const { data, error } = await supabase.functions.invoke('social-auth', {
            method: 'POST',
            body: { action: 'fetch_pages' }
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        
        dismissToast(toastId)
        if (data.success) {
            showSuccess(`Página "${data.page_name}" atualizada!`)
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
    if (!confirm('Tem certeza que deseja desconectar? As automações irão parar.')) return;
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

  const handleConnectOAuth = (platform: 'facebook' | 'google_analytics' | 'google_search_console') => {
    setSubmitting(true)
    try {
      const authUrl = generateOAuthUrl(platform)
      if (!authUrl) {
        setSubmitting(false)
        return
      }
      window.location.href = authUrl
    } catch (error: any) {
      showError('Erro ao iniciar conexão: ' + error.message)
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('URL copiada!')
  }
  
  const formatDate = (dateStr?: string | null) => {
      if (!dateStr) return 'N/A'
      return new Date(dateStr).toLocaleDateString('pt-MZ')
  }

  if (loading) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Link className="w-6 h-6 mr-2 text-primary" />
            Central de Integrações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Alerta de Configuração */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
              <h3 className="font-bold text-blue-800 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Configuração do Facebook Developers</h3>
              <p className="text-blue-700">
                  Adicione esta URL exata em "Login do Facebook &gt; Configurações &gt; URIs de redirecionamento do OAuth válidos":
              </p>
              <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 rounded border border-blue-200 font-mono text-xs break-all text-gray-600">
                      {CALLBACK_URL}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(CALLBACK_URL)}>
                      <Copy className="w-4 h-4" />
                  </Button>
              </div>
          </div>
          
          {/* Integração Facebook */}
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <Facebook className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Facebook & Instagram</h3>
                        <p className="text-sm text-gray-500">Para postagem automática de produtos</p>
                    </div>
                </div>
                {getIntegrationStatus('facebook') ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" /> Conectado
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-gray-500">Não Conectado</Badge>
                )}
            </div>
            
            <div className="p-6">
                {getIntegrationStatus('facebook') ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded border">
                                <span className="text-xs font-bold text-gray-500 uppercase">Página Conectada</span>
                                <div className="font-medium text-gray-900 mt-1 flex items-center">
                                    {getIntegrationStatus('facebook')?.metadata?.page_name || 'Pendente de Sincronização'}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                                <span className="text-xs font-bold text-gray-500 uppercase">ID da Página</span>
                                <div className="font-mono text-sm text-gray-900 mt-1">
                                    {getIntegrationStatus('facebook')?.metadata?.page_id || '-'}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                                <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Token Expira em
                                </span>
                                <div className="font-medium text-gray-900 mt-1">
                                    {formatDate(getIntegrationStatus('facebook')?.expires_at)}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                                <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Última Atualização
                                </span>
                                <div className="font-medium text-gray-900 mt-1">
                                    {formatDate(getIntegrationStatus('facebook')?.updated_at)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button 
                                onClick={handleSyncPages} 
                                disabled={submitting} 
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${submitting ? 'animate-spin' : ''}`} />
                                Sincronizar Páginas
                            </Button>
                            <Button 
                                onClick={() => handleDisconnect('facebook')} 
                                disabled={submitting} 
                                variant="destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Desconectar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                            Conecte sua conta para permitir que a LojaRápida publique produtos automaticamente na sua Página do Facebook e Instagram.
                        </p>
                        <Button 
                            onClick={() => handleConnectOAuth('facebook')}
                            disabled={submitting}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Facebook className="w-5 h-5 mr-2" />}
                            Conectar Facebook Agora
                        </Button>
                    </div>
                )}
            </div>
          </div>
          
          {/* Integração Google Analytics (Placeholder para futuro) */}
          <div className="border rounded-xl overflow-hidden shadow-sm opacity-60">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-lg text-white">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Google Analytics</h3>
                        <p className="text-sm text-gray-500">Em breve</p>
                    </div>
                </div>
                <Badge variant="outline">Em Breve</Badge>
            </div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  )
}

export default IntegrationSettingsTab