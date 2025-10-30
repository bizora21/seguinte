import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Link, Save, Facebook, TrendingUp, CheckCircle, XCircle, Loader2, RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { generateOAuthUrl } from '../../utils/admin' // Importar a função real

interface Integration {
  platform: string
  access_token: string
  metadata: any
  updated_at: string
  expires_at?: string | null
}

// URL base da Edge Function para lidar com o retorno do OAuth
const OAUTH_HANDLER_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/oauth-handler'

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

  // --- FUNÇÃO DE CONEXÃO REAL (REDIRECIONAMENTO) ---
  const handleConnectOAuth = (platform: 'facebook' | 'google_analytics' | 'google_search_console', name: string) => {
    setSubmitting(true)
    
    try {
      const authUrl = generateOAuthUrl(platform)
      
      if (!authUrl) {
        // A função generateOAuthUrl já mostrou um toast de erro se o VITE_ID estiver faltando
        setSubmitting(false)
        return
      }
      
      // Redireciona o usuário para a página de autorização externa
      window.location.href = authUrl
      
    } catch (error: any) {
      showError('Erro ao iniciar o fluxo de conexão: ' + error.message)
      setSubmitting(false)
    }
    // Nota: O estado 'submitting' será limpo após o redirecionamento ou falha.
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
        
        {/* AVISO CRÍTICO SOBRE SECRETS */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
            <p className="font-semibold text-red-800 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Atenção: Chaves Secretas Ausentes
            </p>
            <p className="text-red-700">
                Para que a troca de token funcione, você DEVE configurar as seguintes variáveis como **Secrets** no seu projeto Supabase (Configurações > Edge Functions > Secrets):
            </p>
            <ul className="list-disc list-inside mt-2 font-mono text-xs text-red-900">
                <li>FACEBOOK_APP_ID (Também no .env.local)</li>
                <li>FACEBOOK_APP_SECRET</li>
                <li>GOOGLE_CLIENT_ID (Também no .env.local)</li>
                <li>GOOGLE_CLIENT_SECRET</li>
            </ul>
        </div>
        
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
                  onClick={() => handleConnectOAuth(item.platform as any, item.name)}
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
                Para que a conexão funcione, você DEVE configurar o seguinte URI de redirecionamento OAuth no painel do Meta/Google:
            </p>
            <code className="block mt-1 font-mono text-xs bg-yellow-100 p-1 rounded break-all">
                {OAUTH_HANDLER_URL}
            </code>
            <p className="text-yellow-700 mt-2">
                Além disso, o domínio <code className="font-mono text-xs bg-yellow-100 p-0.5 rounded">bpzqdwpkwlwflrcwcrqp.supabase.co</code> deve ser adicionado aos domínios válidos do seu aplicativo Meta.
            </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default IntegrationSettingsTab