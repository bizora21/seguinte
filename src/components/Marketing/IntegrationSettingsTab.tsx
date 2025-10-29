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
  expires_at?: string | null // Garantir que expires_at é opcional, mas aceita string
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

  // --- FUNÇÃO DE CONEXÃO MOCKADA ---
  const handleConnectOAuth = async (platform: string, name: string) => { // Adicionado 'name'
    setSubmitting(true)
    const toastId = showLoading(`Conectando ${name}... (Simulação)`)
    
    try {
      // Usamos 'Integration' diretamente para garantir que todas as propriedades sejam reconhecidas
      let mockData: Partial<Integration> = { platform }
      
      if (platform === 'facebook') {
        mockData = {
          platform: 'facebook',
          access_token: 'MOCK_FB_TOKEN_1234567890',
          metadata: { page_name: 'LojaRápida MZ', instagram_account: '@lojarapida_mz' },
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      } else if (platform === 'google_analytics') {
        mockData = {
          platform: 'google_analytics',
          access_token: 'MOCK_GA_TOKEN_1234567890',
          metadata: { property_id: 'GA-12345', view_id: '98765' },
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      } else if (platform === 'google_search_console') {
        mockData = {
          platform: 'google_search_console',
          access_token: 'MOCK_SC_TOKEN_1234567890',
          metadata: { property_id: 'SC-12345', site_url: 'https://lojarapidamz.com' },
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      } else {
        throw new Error('Plataforma não suportada.')
      }
      
      // Inserir/Atualizar dados mockados na tabela 'integrations'
      const { error: dbError } = await supabase
        .from('integrations')
        .upsert(mockData as Integration, { onConflict: 'platform' }) // Cast para Integration
        
      if (dbError) throw dbError
      
      dismissToast(toastId)
      showSuccess(`Conexão com ${name} SIMULADA com sucesso!`) // Corrigido: usando 'name'
      fetchIntegrations() // Recarregar a lista para mostrar o status 'Conectado'
      
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro na simulação de conexão: ' + error.message)
    } finally {
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
                  onClick={() => handleConnectOAuth(item.platform, item.name)} // Corrigido: passando item.name
                  disabled={submitting}
                  variant={isConnected ? 'outline' : 'default'}
                  className={isConnected ? 'text-gray-700' : 'bg-blue-600 hover:bg-blue-700'}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isConnected ? 'Reconectar (Simulado)' : 'Conectar (Simulado)'}
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
                A conexão OAuth foi SIMULADA devido a erros de configuração do Facebook. Os tokens mockados foram inseridos no banco de dados para permitir o teste das funcionalidades de Agendamento Social e Métricas.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-xs">
                <li>VITE_FACEBOOK_APP_ID (Usando ID de teste: 2220391788200892)</li>
                <li>VITE_GOOGLE_CLIENT_ID</li>
                <li>FACEBOOK_APP_SECRET (Apenas Supabase Secret)</li>
                <li>GOOGLE_CLIENT_SECRET (Apenas Supabase Secret)</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default IntegrationSettingsTab