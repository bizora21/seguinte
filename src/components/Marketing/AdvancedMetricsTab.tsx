import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Zap, Users, ShoppingCart, Store, Search, TrendingUp, Loader2, Link, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'

interface FunnelData {
  visitors: number
  registrations: number
  first_purchases: number
  conversion_rate: string
}

interface SellerFunnelData {
  visitors: number
  started_registration: number
  completed_registration: number
  conversion_rate: string
}

interface KeywordData {
  keyword: string
  impressions: number
  clicks: number
  ctr: string
  source: 'search_console' | 'analytics'
}

const MOCK_KEYWORDS: KeywordData[] = [
  { keyword: 'vender online moçambique', impressions: 5200, clicks: 150, ctr: '2.8%', source: 'search_console' },
  { keyword: 'comprar na maputo', impressions: 12000, clicks: 800, ctr: '6.7%', source: 'search_console' },
  { keyword: 'loja rapida', impressions: 8000, clicks: 4500, ctr: '56.2%', source: 'search_console' },
]

const AdvancedMetricsTab = () => {
  const [clientFunnel, setClientFunnel] = useState<FunnelData | null>(null)
  const [sellerFunnel, setSellerFunnel] = useState<SellerFunnelData | null>(null)
  const [keywords, setKeywords] = useState<KeywordData[]>(MOCK_KEYWORDS)
  const [loading, setLoading] = useState(true)
  const [integrationStatus, setIntegrationStatus] = useState({ ga: false, sc: false })

  useEffect(() => {
    fetchMetrics()
    fetchIntegrationStatus()
  }, [])

  const fetchIntegrationStatus = async () => {
    // Simulação de busca de status de integração
    setIntegrationStatus({ ga: true, sc: true })
  }

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      // Chamada para a Edge Function para buscar dados do funil de clientes
      // CORREÇÃO: Usar 'path' no invoke é incorreto. Deve-se usar 'path' no URL da função.
      // Como estamos usando o invoke, passamos o path como parte da URL da função.
      const { data: clientData, error: clientError } = await supabase.functions.invoke('analytics-manager?action=get_funnel_data', {
        method: 'GET',
      })
      
      if (clientError) throw clientError
      
      setClientFunnel(clientData.data as FunnelData)
      
      // Simulação de funil de vendedores (em um sistema real, seria outra chamada à Edge Function)
      setSellerFunnel({
        visitors: 2500,
        started_registration: 450,
        completed_registration: 80,
        conversion_rate: '3.2%'
      })
      
      showSuccess('Métricas atualizadas com sucesso (incluindo cache)!')

    } catch (error: any) {
      console.error('Error fetching metrics:', error)
      showError('Falha ao carregar métricas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const renderFunnelCard = (title: string, value: number | string, description: string, icon: React.ReactNode) => (
    <Card className="text-center">
      <CardContent className="p-4">
        <div className="flex items-center justify-center mb-2">{icon}</div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Status de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Link className="w-5 h-5 mr-2" />
            Status das APIs do Google
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg flex items-center space-x-2 ${integrationStatus.ga ? 'bg-green-50' : 'bg-red-50'}`}>
            {integrationStatus.ga ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <span className="font-medium">Google Analytics</span>
          </div>
          <div className={`p-3 rounded-lg flex items-center space-x-2 ${integrationStatus.sc ? 'bg-green-50' : 'bg-red-50'}`}>
            {integrationStatus.sc ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <span className="font-medium">Search Console</span>
          </div>
          <Button onClick={fetchMetrics} disabled={loading} className="col-span-2" variant="outline">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Atualizar Métricas
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="clients">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="clients" className="py-2 text-sm flex items-center">
            <ShoppingCart className="w-4 h-4 mr-1" /> Aquisição de Clientes
          </TabsTrigger>
          <TabsTrigger value="sellers" className="py-2 text-sm flex items-center">
            <Store className="w-4 h-4 mr-1" /> Aquisição de Vendedores
          </TabsTrigger>
        </TabsList>

        {/* Funil de Clientes */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Funil de Aquisição de Clientes (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center h-32"><LoadingSpinner size="lg" /></div>
              ) : clientFunnel ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderFunnelCard('Visitantes', clientFunnel.visitors.toLocaleString('pt-MZ'), 'Tráfego total no site', <Users className="w-6 h-6 text-blue-600" />)}
                    {renderFunnelCard('Cadastros', clientFunnel.registrations.toLocaleString('pt-MZ'), 'Novos usuários registrados', <Zap className="w-6 h-6 text-yellow-600" />)}
                    {renderFunnelCard('1ª Compra', clientFunnel.first_purchases.toLocaleString('pt-MZ'), 'Clientes que fizeram a primeira compra', <ShoppingCart className="w-6 h-6 text-green-600" />)}
                    {renderFunnelCard('Taxa de Conversão', clientFunnel.conversion_rate, 'Visitante para 1ª Compra', <TrendingUp className="w-6 h-6 text-purple-600" />)}
                  </div>
                  
                  <h3 className="text-lg font-semibold border-t pt-4">Produtos que Mais Convertem (Simulação)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-gray-700 border-b pb-1">
                      <span>Produto</span>
                      <span>Novos Clientes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Smartphone Ultra Rápido MZ</span>
                      <span className="font-semibold text-green-600">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tênis Esportivo Leve</span>
                      <span className="font-semibold text-green-600">30%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-red-600">
                  <p>Não foi possível carregar os dados do funil de clientes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funil de Vendedores */}
        <TabsContent value="sellers">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Funil de Aquisição de Vendedores (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center h-32"><LoadingSpinner size="lg" /></div>
              ) : sellerFunnel ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderFunnelCard('Visitantes (Pág. Vendedor)', sellerFunnel.visitors.toLocaleString('pt-MZ'), 'Tráfego na página de recrutamento', <Users className="w-6 h-6 text-blue-600" />)}
                    {renderFunnelCard('Iniciaram Cadastro', sellerFunnel.started_registration.toLocaleString('pt-MZ'), 'Usuários que começaram o formulário', <Store className="w-6 h-6 text-yellow-600" />)}
                    {renderFunnelCard('Concluíram Cadastro', sellerFunnel.completed_registration.toLocaleString('pt-MZ'), 'Novos vendedores ativos', <CheckCircle className="w-6 h-6 text-green-600" />)}
                    {renderFunnelCard('Taxa de Conversão', sellerFunnel.conversion_rate, 'Visitante para Vendedor Ativo', <TrendingUp className="w-6 h-6 text-purple-600" />)}
                  </div>
                  
                  <h3 className="text-lg font-semibold border-t pt-4 flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Palavras-chave que Atraem Vendedores
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-gray-700 border-b pb-1">
                      <span className="w-1/3">Palavra-chave</span>
                      <span className="w-1/3 text-center">Impressões</span>
                      <span className="w-1/3 text-right">CTR</span>
                    </div>
                    {keywords.filter(k => k.keyword.includes('vender')).map((k, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="w-1/3 font-medium">{k.keyword}</span>
                        <span className="w-1/3 text-center">{k.impressions.toLocaleString('pt-MZ')}</span>
                        <span className="w-1/3 text-right font-semibold text-blue-600">{k.ctr}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-red-600">
                  <p>Não foi possível carregar os dados do funil de vendedores.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdvancedMetricsTab