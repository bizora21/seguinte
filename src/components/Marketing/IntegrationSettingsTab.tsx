import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Link, Save, Facebook, TrendingUp, CheckCircle, XCircle, Loader2, RefreshCw, Search, AlertTriangle, Copy } from 'lucide-react'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const CALLBACK_URL = "https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/social-auth"

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
  
  useEffect(() => {
    const status = searchParams.get('status')
    const message = searchParams.get('message')
    const platform = searchParams.get('platform')
    
    if (status) {
      if (status === 'social-auth-success') {
        showSuccess(`Conexão com ${platform} estabelecida com sucesso!`)
      } else if (status === 'social-auth-error') {
        showError(`Falha na conexão com ${platform}: ${decodeURIComponent(message || 'Erro desconhecido')}`)
      }
      
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('status')
      newParams.delete('message')
      newParams.delete('platform')
      newParams.delete('code') // Limpar código também
      navigate({ search: newParams.toString() }, { replace: true })
      
      fetchIntegrations()
    } else {
      fetchIntegrations()
    }
  }, [searchParams, navigate])

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
    { platform: 'facebook', name: 'Facebook & Instagram', icon: <Facebook className="w-6 h-6 text-blue-600" />, description: 'Necessário para agendamento e publicação automática.' },
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
          
          {/* INSTRUÇÕES DE CONFIGURAÇÃO */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-3">
              <h3 className="font-bold text-blue-800 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Configuração Obrigatória no Facebook Developers</h3>
              <p className="text-blue-700">
                  Para ativar as automações reais, você precisa criar um App no <a href="https://developers.facebook.com" target="_blank" className="underline font-bold">Meta for Developers</a> e adicionar esta URL no campo <strong>"URIs de redirecionamento do OAuth válidos"</strong>:
              </p>
              <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 rounded border border-blue-200 font-mono text-xs break-all">
                      {CALLBACK_URL}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(CALLBACK_URL)}>
                      <Copy className="w-4 h-4" />
                  </Button>
              </div>
              <p className="text-xs text-blue-600">
                  * Lembre-se de adicionar o <strong>App ID</strong> e <strong>App Secret</strong> nos Secrets do Supabase.
              </p>
          </div>
          
          <div className="space-y-4">
            {integrationList.map((item) => {
              const status = getIntegrationStatus(item.platform)
              const isConnected = !!status
              
              return (
                <div key={item.platform} className={`p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border gap-4 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      {isConnected && (
                        <div className="flex items-center text-xs text-green-700 mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectado. (ID: {status.metadata?.page_id ? 'Página Configurada' : 'Pendente'})
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleConnectOAuth(item.platform as any, item.name)}
                    disabled={submitting}
                    variant={isConnected ? 'outline' : 'default'}
                    className={isConnected ? 'text-gray-700 border-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isConnected ? 'Reconectar Conta' : 'Conectar Agora'}
                  </Button>
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