import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Link, Save, Facebook, TrendingUp, CheckCircle, XCircle, Loader2, RefreshCw, Search } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'

interface Integration {
  platform: string
  access_token: string
  metadata: any
  updated_at: string
  expires_at?: string | null
}

// URL base da Edge Function para lidar com o retorno do OAuth
const OAUTH_HANDLER_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/oauth-handler'

// Lendo variáveis de ambiente do Vite (para desenvolvimento local)
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '2220391788200892' 
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'MOCK_GOOGLE_ID' 

const IntegrationSettingsTab = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchIntegrations()
  }, [])

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
      showError('Erro ao carregar integrações: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getIntegrationStatus = (platform: string) => {
    return integrations.find(i => i.platform === platform)
  }

  // --- FUNÇÃO DE CONEXÃO REAL ---
  const handleConnectOAuth = async (platform: string, name: string) => {
    setSubmitting(true)
    
    // 1. Definir o URI de redirecionamento para a Edge Function
    const redirectUri = `${OAUTH_HANDLER_URL}?platform=${platform}`
    
    let authUrl = ''
    
    if (platform === 'facebook') {
      if (!FACEBOOK_APP_ID) {
        showError('VITE_FACEBOOK_APP_ID não configurado no .env.local')
        setSubmitting(false)
        return
      }
      // Permissões necessárias para gerenciar páginas e posts
      const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_manage_comments,instagram_manage_insights'
      
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`
      
    } else if (platform.startsWith('google')) {
      if (!GOOGLE_CLIENT_ID) {
        showError('VITE_GOOGLE_CLIENT_ID não configurado no .env.local')
        setSubmitting(false)
        return
      }
      
      let scope = ''
      if (platform === 'google_analytics') {
        scope = 'https://www.googleapis.com/auth/analytics.readonly'
      } else if (platform === 'google_search_console') {
        scope = 'https://www.googleapis.com/auth/webmasters.readonly'
      }
      
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`
    } else {
      showError('Plataforma não suportada.')
      setSubmitting(false)
      return
    }
    
    // 2. Redirecionar o usuário
    window.location.href = authUrl
    
    // O estado 'submitting' será limpo após o redirecionamento ou falha.
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
                  onClick={() => handleConnectOAuth(item.platform, item.name)}
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
            <p className="font-semibold text-yellow-800 mb-2">Aviso de Configuração</p>
            <p className="text-yellow-700">
                Para que a conexão funcione, você deve garantir que as variáveis de ambiente (Secrets) `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estejam configuradas no painel do Supabase.
            </p>
            <p className="text-yellow-700 mt-2">
                Além disso, o URI de redirecionamento configurado no Meta/Google deve ser: 
                <code className="block mt-1 font-mono text-xs bg-yellow-100 p-1 rounded break-all">
                    {OAUTH_HANDLER_URL}?platform=[plataforma]
                </code>
            </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default IntegrationSettingsTab