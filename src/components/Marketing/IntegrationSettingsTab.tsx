import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Link, Save, Facebook, TrendingUp, CheckCircle, XCircle, Loader2, RefreshCw, Search } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'
import { supabase } from '../../lib/supabase'

interface Integration {
  platform: string
  access_token: string
  metadata: any
  updated_at: string
}

// URL base da Edge Function para lidar com o retorno do OAuth
const OAUTH_HANDLER_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/oauth-handler'

// Lendo variáveis de ambiente do Vite (para desenvolvimento local)
// O usuário deve configurar VITE_FACEBOOK_APP_ID no .env.local
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || 'MOCK_FB_ID' 
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'MOCK_GOOGLE_ID' 

const IntegrationSettingsTab = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchIntegrations()
    checkOAuthStatus()
  }, [])

  const checkOAuthStatus = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get('status')
    const platform = urlParams.get('platform')
    const message = urlParams.get('message')

    if (status === 'success' && platform) {
      showSuccess(`Conexão com ${platform} estabelecida com sucesso!`)
      // Limpar parâmetros da URL
      navigateWithoutParams()
    } else if (status === 'failure') {
      showError(`Falha na conexão: ${message || 'Erro desconhecido'}`)
      navigateWithoutParams()
    }
  }
  
  const navigateWithoutParams = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('status')
    url.searchParams.delete('platform')
    url.searchParams.delete('message')
    window.history.replaceState({}, document.title, url.pathname + url.search)
  }

  const fetchIntegrations = async () => {
    setLoading(true)
    try {
      // Apenas o admin pode ler esta tabela devido ao RLS
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        
      if (error) throw error
      
      setIntegrations(data as Integration[] || [])
    } catch (error: any) {
      console.error('Error fetching integrations:', error)
      showError('Erro ao carregar integrações: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getIntegrationStatus = (platform: string) => {
    return integrations.find(i => i.platform === platform)
  }

  const handleConnectOAuth = (platform: string) => {
    setSubmitting(true)
    
    // A URL de redirecionamento deve ser a URL da Edge Function
    const redirectUri = OAUTH_HANDLER_URL
    
    let authUrl = ''
    
    if (platform === 'facebook') {
      const facebookAppId = FACEBOOK_APP_ID 
      if (facebookAppId === 'MOCK_FB_ID') {
        showError('Erro: VITE_FACEBOOK_APP_ID não configurado no .env.local.')
        setSubmitting(false)
        return
      }
      
      // Escopos necessários para Instagram/Facebook
      const scope = 'pages_show_list,instagram_basic,instagram_manage_insights'
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${redirectUri}?platform=facebook&scope=${scope}&state=${Date.now()}`
      
    } else if (platform === 'google_analytics') {
      const googleClientId = GOOGLE_CLIENT_ID 
      if (googleClientId === 'MOCK_GOOGLE_ID') {
        showError('Erro: VITE_GOOGLE_CLIENT_ID não configurado no .env.local.')
        setSubmitting(false)
        return
      }
      
      const scope = 'https://www.googleapis.com/auth/analytics.readonly'
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}?platform=google_analytics&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
      
    } else if (platform === 'google_search_console') {
      const googleClientId = GOOGLE_CLIENT_ID 
      if (googleClientId === 'MOCK_GOOGLE_ID') {
        showError('Erro: VITE_GOOGLE_CLIENT_ID não configurado no .env.local.')
        setSubmitting(false)
        return
      }
      
      const scope = 'https://www.googleapis.com/auth/webmasters.readonly'
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}?platform=google_search_console&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
    }
    
    if (authUrl) {
      // Redirecionar o usuário para a página de autorização
      window.location.href = authUrl
    } else {
      showError('Plataforma de integração não reconhecida.')
      setSubmitting(false)
    }
  }
  
  const integrationList = [
    { platform: 'facebook', name: 'Facebook & Instagram', icon: <Facebook className="w-6 h-6 text-blue-600" />, description: 'Necessário para agendamento e publicação de posts.' },
    { platform: 'google_analytics', name: 'Google Analytics', icon: <TrendingUp className="w-6 h-6 text-orange-600" />, description: 'Necessário para o Funil de Aquisição de Clientes.' },
    { platform: 'google_search_console', name: 'Google Search Console', icon: <Search className="w-6 h-6 text-red-600" />, description: 'Necessário para Palavras-chave de Aquisição.' },
  ]

  if (loading) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Link className="w-6 h-6 mr-2" />
          Configurações de Integração (OAuth)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-gray-600">
          Conecte as contas de marketing da LojaRápida para ativar a automação e as métricas avançadas.
        </p>
        
        <div className="space-y-4">
          {integrationList.map((item) => {
            const status = getIntegrationStatus(item.platform)
            const isConnected = !!status
            
            return (
              <div key={item.platform} className={`p-4 rounded-lg flex items-center justify-between border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    {isConnected && (
                      <div className="flex items-center text-xs text-green-700 mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Conectado. Última atualização: {new Date(status.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => handleConnectOAuth(item.platform)} 
                  disabled={submitting}
                  variant={isConnected ? 'outline' : 'default'}
                  className={isConnected ? 'text-gray-700' : 'bg-blue-600 hover:bg-blue-700'}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isConnected ? 'Reconectar' : 'Conectar'}
                </Button>
              </div>
            )
          })}
        </div>
        
        <Button onClick={fetchIntegrations} variant="ghost" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Status
        </Button>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="font-semibold text-yellow-800 mb-2">Aviso de Configuração Local</p>
            <p className="text-yellow-700">
                Para que a conexão funcione, você deve adicionar as seguintes variáveis ao seu arquivo <code className="font-mono">.env.local</code> (ou Supabase Secrets):
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-xs">
                <li>VITE_FACEBOOK_APP_ID</li>
                <li>VITE_GOOGLE_CLIENT_ID</li>
                <li>FACEBOOK_APP_SECRET (Apenas Supabase Secret)</li>
                <li>GOOGLE_CLIENT_SECRET (Apenas Supabase Secret)</li>
            </ul>
            <p className="text-xs text-red-700 mt-2">
                O erro "ID do app inválido" indica que o valor de VITE_FACEBOOK_APP_ID no seu ambiente local está incorreto ou ausente.
            </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default IntegrationSettingsTab