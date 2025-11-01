import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ArrowLeft, Zap, Users, Send, Share2, Calendar, TrendingUp, Clock, MousePointerClick, Link, Settings, Globe, FileText, Target, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import LeadCaptureTab from '../components/Marketing/LeadCaptureTab'
import EmailAutomationTab from '../components/Marketing/EmailAutomationTab'
import SocialMediaIntegrationTab from '../components/Marketing/SocialMediaIntegrationTab'
import AdvancedMetricsTab from '../components/Marketing/AdvancedMetricsTab'
import IntegrationSettingsTab from '../components/Marketing/IntegrationSettingsTab'
import BlogPublishingTab from '../components/Marketing/BlogPublishingTab'
import ContentMachineTab from '../components/Marketing/ContentMachineTab'

interface MarketingStats {
  totalLeads: number
  weeklyLeads: number
  monthlyLeads: number
  openRate: string
  clickRate: string
}

const AdminMarketingCenter = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'leads' // Define a aba ativa, padrão para 'leads'
  
  const [stats, setStats] = useState<MarketingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      // 1. Total de Leads
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
      
      // 2. Leads da Semana (Simulação)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: weeklyLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo)
        
      // 3. Leads do Mês (Simulação)
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { count: monthlyLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneMonthAgo)

      setStats({
        totalLeads: totalLeads || 0,
        weeklyLeads: weeklyLeads || 0,
        monthlyLeads: monthlyLeads || 0,
        openRate: '45.2%', // Mock
        clickRate: '12.8%', // Mock
      })

    } catch (error) {
      console.error('Error fetching marketing stats:', error)
      setStats({
        totalLeads: 0,
        weeklyLeads: 0,
        monthlyLeads: 0,
        openRate: '0%',
        clickRate: '0%',
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = useMemo(() => [
    {
      title: 'Total de Leads',
      value: stats?.totalLeads.toLocaleString('pt-MZ') || '0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Leads Esta Semana',
      value: stats?.weeklyLeads.toLocaleString('pt-MZ') || '0',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Taxa de Abertura (Média)',
      value: stats?.openRate || '0%',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Taxa de Clique (Média)',
      value: stats?.clickRate || '0%',
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    }
  ], [stats])

  // Função auxiliar para mudar a aba e preservar outros parâmetros
  const handleTabChange = (tab: string) => {
    setSearchParams(prev => {
      prev.set('tab', tab)
      return prev
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Admin Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Zap className="w-7 h-7 mr-3 text-yellow-600" />
            Hub de Crescimento Inteligente
          </h1>
          <p className="text-gray-600 mt-2">Ferramentas de Growth Hacking para escalar a LojaRápida.</p>
        </div>

        {/* Ação Rápida: Centro de Marketing */}
        <Card className="mb-8 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-yellow-600" />
                    <p className="font-semibold text-yellow-800">
                        Máquina de Conteúdo: Gere um artigo completo em segundos.
                    </p>
                </div>
                <Button 
                    // Chamada direta para setSearchParams
                    onClick={() => handleTabChange('content-machine')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    size="sm"
                >
                    Acessar Máquina <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
                </Button>
            </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Links Rápidos e Calendário (Simulação) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Agendamento de Campanhas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Use esta seção para agendar o envio de campanhas de e-mail manuais para toda a base de clientes.
                    </p>
                    <Button onClick={() => handleTabChange('social')} variant="outline" className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Ir para Agendamento Social
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Análise Estratégica
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Visualize funis de aquisição e palavras-chave de crescimento.
                    </p>
                    <Button onClick={() => handleTabChange('metrics')} className="w-full bg-purple-600 hover:bg-purple-700">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Ver Métricas Avançadas
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Tabs de Módulos */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 h-auto p-1">
            <TabsTrigger value="content-machine" className="py-2 text-xs sm:text-sm flex items-center">
                <Zap className="w-4 h-4 mr-1" /> Máquina
            </TabsTrigger>
            <TabsTrigger value="leads" className="py-2 text-xs sm:text-sm flex items-center">
                <Users className="w-4 h-4 mr-1" /> Leads
            </TabsTrigger>
            <TabsTrigger value="email" className="py-2 text-xs sm:text-sm flex items-center">
                <Send className="w-4 h-4 mr-1" /> E-mail
            </TabsTrigger>
            <TabsTrigger value="social" className="py-2 text-xs sm:text-sm flex items-center">
                <Share2 className="w-4 h-4 mr-1" /> Social
            </TabsTrigger>
            <TabsTrigger value="blog" className="py-2 text-xs sm:text-sm flex items-center">
                <Globe className="w-4 h-4 mr-1" /> Blog
            </TabsTrigger>
            <TabsTrigger value="metrics" className="py-2 text-xs sm:text-sm flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="settings" className="py-2 text-xs sm:text-sm flex items-center">
                <Settings className="w-4 h-4 mr-1" /> Configurações
            </TabsTrigger>
          </TabsList>
          
          {/* Tab 0: Content Machine */}
          <TabsContent value="content-machine">
            <ContentMachineTab />
          </TabsContent>
          
          {/* Tab 1: Captura de Leads */}
          <TabsContent value="leads">
            <LeadCaptureTab />
          </TabsContent>

          {/* Tab 2: E-mail Marketing */}
          <TabsContent value="email">
            <EmailAutomationTab />
          </TabsContent>
          
          {/* Tab 3: Social Media Manager */}
          <TabsContent value="social">
            <SocialMediaIntegrationTab />
          </TabsContent>
          
          {/* Tab 4: Blog Publishing */}
          <TabsContent value="blog">
            <BlogPublishingTab />
          </TabsContent>
          
          {/* Tab 5: Advanced Metrics */}
          <TabsContent value="metrics">
            <AdvancedMetricsTab />
          </TabsContent>
          
          {/* Tab 6: Integration Settings */}
          <TabsContent value="settings">
            <IntegrationSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminMarketingCenter