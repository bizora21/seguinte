import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Link, Facebook, TrendingUp, CheckCircle, Loader2, RefreshCw, AlertTriangle, Copy, Trash2, Calendar, ShieldCheck, Database, Info, Activity, Flag, Instagram, Lock, ExternalLink, Code } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { generateOAuthUrl } from '../../utils/admin' 
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'

interface Integration {
  platform: string
  access_token: string
  metadata: any
  updated_at: string
  expires_at?: string | null
}

interface FacebookPage {
  id: string
  name: string
  category: string
  instagram_id?: string | null
  access_token?: string // Verifica se temos token
  tasks?: string[] // Lista de permissões reais (MODERATE, CREATE_CONTENT, etc)
}

const IntegrationSettingsTab = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]) 
  const [pagesLoaded, setPagesLoaded] = useState(false)
  const [rawResponse, setRawResponse] = useState<string>('') // Para debug
  
  const CALLBACK_URL = `${window.location.origin}/oauth-callback`

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
    const handleOAuthSuccess = () => setTimeout(fetchIntegrations, 1500)
    window.addEventListener('oauth-success', handleOAuthSuccess)
    return () => window.removeEventListener('oauth-success', handleOAuthSuccess)
  }, [])

  useEffect(() => {
    const fb = integrations.find(i => i.platform === 'facebook');
    if (fb && fb.access_token !== 'PENDENTE_DE_CONEXAO') {
        handleSyncPages(true); 
    }
  }, [integrations.length]) 

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
              showSuccess(`Sucesso! Servidor respondeu: "${data.message}".`);
          } else {
              showError('Servidor respondeu, mas indicou falha.');
          }
      } catch (error: any) {
          dismissToast(toastId);
          showError(`Falha de rede: ${error.message}`);
      }
  }

  const handleSyncPages = async (silent = false) => {
    if (!silent) setSubmitting(true)
    const toastId = !silent ? showLoading('Analisando permissões das páginas...') : null
    
    try {
        const { data, error } = await supabase.functions.invoke('social-auth', {
            method: 'POST',
            body: { action: 'get_connected_pages' }
        })
        
        if (toastId) dismissToast(toastId)
        
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        
        // Guardar resposta bruta para debug
        setRawResponse(JSON.stringify(data, null, 2))
        
        if (data.success && data.pages) {
            setFacebookPages(data.pages)
            if (!silent) showSuccess(`${data.pages.length} página(s) encontradas.`)
        } else {
            if (!silent) showError('Conexão ativa, mas nenhuma página retornada pelo Facebook.')
        }
    } catch (error: any) {
        if (toastId) dismissToast(toastId)
        if (!silent) showError(`Erro ao listar páginas: ${error.message}`)
    } finally {
        if (!silent) setSubmitting(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!confirm('Tem certeza? Isso removerá o token de acesso.')) return;
    setSubmitting(true);
    const toastId = showLoading('Desconectando...');
    try {
        const { error } = await supabase.from('integrations').delete().eq('platform', platform);
        if (error) throw error;
        dismissToast(toastId);
        showSuccess('Desconectado.');
        setIntegrations(prev => prev.filter(i => i.platform !== platform));
        setFacebookPages([]); 
    } catch (error: any) {
        dismissToast(toastId);
        showError('Erro: ' + error.message);
    } finally {
        setSubmitting(false);
    }
  };

  const getIntegrationStatus = (platform: string) => {
    return integrations.find(i => i.platform === platform)
  }

  const isPending = (integration: Integration | null) => {
      return integration?.access_token === 'PENDENTE_DE_CONEXAO';
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
      showError('Erro: ' + error.message)
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('Copiado!')
  }
  
  // Função para verificar se a página tem permissão de criação de conteúdo
  const hasPublishPermission = (page: FacebookPage) => {
      if (!page.tasks) return false;
      // CREATE_CONTENT é a permissão chave para postar
      return page.tasks.includes('CREATE_CONTENT') || page.tasks.includes('MANAGE');
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
            <Button onClick={fetchIntegrations} variant="ghost" size="sm" title="Recarregar">
                <RefreshCw className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2 shadow-sm">
              <h3 className="font-bold text-blue-800 flex items-center"><Info className="w-4 h-4 mr-2" /> SOLUÇÃO DE PROBLEMAS</h3>
              <p className="text-blue-700">
                  <strong>Página faltando?</strong> Isso acontece porque ela está num Gerenciador de Negócios (Business Manager).
                  <br/>1. Acesse o <a href="https://business.facebook.com/settings/people" target="_blank" rel="noopener noreferrer" className="underline font-bold">Meta Business Suite</a>.
                  <br/>2. Vá em Configurações do Negócio {'>'} Usuários {'>'} Pessoas.
                  <br/>3. Clique no seu nome e verifique se a página está em "Ativos Atribuídos". Se não estiver, clique em "Adicionar Ativos".
              </p>
          </div>
          
          <div className={`border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${fbIntegration ? 'ring-1 ring-green-500 border-green-500' : ''}`}>
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-[#1877F2] p-2.5 rounded-lg text-white shadow-sm">
                        <Facebook className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Facebook & Instagram</h3>
                    </div>
                </div>
                {fbIntegration ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> CONECTADO
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-gray-500 bg-white">Desconectado</Badge>
                )}
            </div>
            
            <div className="p-6 bg-white">
                {fbIntegration && !isPending(fbIntegration) ? (
                    <div className="space-y-6">
                        {/* LISTA DE PÁGINAS COM DIAGNÓSTICO */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                                <h4 className="font-bold text-sm text-gray-700 flex items-center">
                                    <Flag className="w-4 h-4 mr-2 text-blue-600" /> 
                                    Suas Páginas ({facebookPages.length})
                                </h4>
                                <div className="flex gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900" title="Ver JSON Bruto">
                                                <Code className="w-3 h-3 mr-1" /> Debug
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Resposta Bruta do Facebook API</DialogTitle>
                                            </DialogHeader>
                                            <pre className="bg-slate-950 text-green-400 p-4 rounded text-xs font-mono whitespace-pre-wrap overflow-x-hidden">
                                                {rawResponse || 'Nenhum dado carregado. Clique em Atualizar Lista.'}
                                            </pre>
                                        </DialogContent>
                                    </Dialog>
                                    <Button onClick={() => handleSyncPages(false)} size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800">
                                        <RefreshCw className={`w-3 h-3 mr-1 ${submitting ? 'animate-spin' : ''}`} /> Atualizar Lista
                                    </Button>
                                </div>
                            </div>
                            <div className="divide-y max-h-60 overflow-y-auto">
                                {facebookPages.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        Nenhuma página encontrada. Verifique se sua conta do Facebook é administradora da página.
                                    </div>
                                ) : (
                                    facebookPages.map(page => {
                                        const canPublish = hasPublishPermission(page);
                                        return (
                                            <div key={page.id} className={`px-4 py-3 flex justify-between items-center ${canPublish ? 'hover:bg-green-50' : 'bg-red-50'}`}>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900 flex items-center">
                                                        {page.name}
                                                        {page.instagram_id && (
                                                            <span className="ml-2 flex items-center text-xs text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">
                                                                <Instagram className="w-3 h-3 mr-1" /> +Insta
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        <span className="font-mono">ID: {page.id}</span>
                                                        <span className="mx-1">•</span>
                                                        <span>Permissões: {page.tasks ? page.tasks.join(', ') : 'NENHUMA'}</span>
                                                    </div>
                                                </div>
                                                
                                                {canPublish ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> PRONTA
                                                    </Badge>
                                                ) : (
                                                    <div className="text-right">
                                                        <Badge variant="destructive" className="flex items-center mb-1">
                                                            <Lock className="w-3 h-3 mr-1" /> RESTRITA
                                                        </Badge>
                                                        <p className="text-[10px] text-red-600 font-medium">Falta permissão de criar conteúdo</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button 
                                onClick={() => handleConnectOAuth('facebook')} 
                                disabled={submitting} 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Forçar Reconexão (Resolver Problemas)
                            </Button>
                            <Button 
                                onClick={() => handleDisconnect('facebook')} 
                                disabled={submitting} 
                                variant="destructive"
                                className="bg-white text-red-600 border border-red-200 hover:bg-red-50"
                            >
                                Desconectar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 px-4">
                        <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                            Conecte sua conta para permitir que a LojaRápida publique produtos automaticamente.
                        </p>
                        <Button 
                            onClick={() => handleConnectOAuth('facebook')}
                            disabled={submitting}
                            size="lg"
                            className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-8 h-12 shadow-lg transition-all hover:scale-105"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Facebook className="w-5 h-5 mr-2" />}
                            Conectar Facebook
                        </Button>
                    </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default IntegrationSettingsTab