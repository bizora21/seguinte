import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ArrowLeft, Zap, Users, Share2, TrendingUp, FileText, Send, LayoutDashboard, Database, Rocket, Timer } from 'lucide-react'
import LeadCaptureTab from '../components/Marketing/LeadCaptureTab'
import EmailAutomationTab from '../components/Marketing/EmailAutomationTab'
import AdvancedMetricsTab from '../components/Marketing/AdvancedMetricsTab'
import IntegrationSettingsTab from '../components/Marketing/IntegrationSettingsTab'
import ContentManagerTab from '../components/Marketing/ContentManagerTab'
import BlogCategoryManager from '../components/Marketing/BlogCategoryManager'
import LeadsListTab from '../components/Marketing/LeadsListTab'
import EmailTemplateManagerTab from '../components/Marketing/EmailTemplateManagerTab'
import EmailBroadcastTab from '../components/Marketing/EmailBroadcastTab'
import MarketingOverview from '../components/Marketing/MarketingOverview'
import SocialContentGenerator from '../components/Marketing/SocialContentGenerator'
import TrafficMatrix from '../components/Marketing/TrafficMatrix'
import FlashDealManager from '../components/Marketing/FlashDealManager'
import OAuthCallbackModal from '../components/Marketing/OAuthCallbackModal'

const AdminMarketingCenter = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const codeParam = searchParams.get('code')
  
  const getInitialTab = () => {
    if (codeParam) return 'settings'
    return searchParams.get('tab') || 'overview'
  }

  const [activeTab, setActiveTab] = useState(getInitialTab())

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', value)
    
    newParams.delete('code')
    newParams.delete('state')
    
    navigate({ search: newParams.toString() }, { replace: true })
  }

  const handleOAuthComplete = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    url.searchParams.set('tab', 'settings')
    window.history.replaceState({}, '', url.toString())
    setSearchParams({ tab: 'settings' })
    setActiveTab('settings')
    setTimeout(() => {
        window.dispatchEvent(new Event('oauth-success'))
    }, 100)
  }

  if (codeParam) {
    return <OAuthCallbackModal code={codeParam} stateParam={searchParams.get('state')} onComplete={handleOAuthComplete} />
  }

  // Verifica se a aba ativa precisa de largura total
  const isFullWidth = activeTab === 'broadcast' || activeTab === 'social' || activeTab === 'traffic_matrix';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className={`mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 ${isFullWidth ? 'max-w-[1920px]' : 'max-w-7xl'}`}>
        
        {/* Header Compacto */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/dashboard/admin')} className="mr-4 text-gray-600 hover:text-gray-900 h-10 w-10 p-0 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                Centro de Marketing
                <div className="ml-3 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center">
                    <Database className="w-3 h-3 mr-1" /> Pro v3.0
                </div>
              </h1>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          
          {/* Navegação Principal */}
          <div className="sticky top-0 z-30 bg-gray-50 pb-2">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-white border rounded-xl shadow-sm no-scrollbar">
              <TabsTrigger value="overview" className="py-2.5 px-4 whitespace-nowrap"><LayoutDashboard className="w-4 h-4 mr-2" /> Visão Geral</TabsTrigger>
              <TabsTrigger value="social" className="py-2.5 px-4 whitespace-nowrap"><Share2 className="w-4 h-4 mr-2" /> Social</TabsTrigger>
              <TabsTrigger value="flash_deals" className="py-2.5 px-4 bg-orange-50 data-[state=active]:bg-orange-600 data-[state=active]:text-white whitespace-nowrap"><Timer className="w-4 h-4 mr-2" /> Flash Sales</TabsTrigger>
              <TabsTrigger value="content" className="py-2.5 px-4 whitespace-nowrap"><FileText className="w-4 h-4 mr-2" /> SEO & Blog</TabsTrigger>
              <TabsTrigger value="traffic_matrix" className="py-2.5 px-4 whitespace-nowrap"><Rocket className="w-4 h-4 mr-2" /> Matriz SEO</TabsTrigger>
              <TabsTrigger value="leads" className="py-2.5 px-4 whitespace-nowrap"><Users className="w-4 h-4 mr-2" /> Leads</TabsTrigger>
              <TabsTrigger value="broadcast" className="py-2.5 px-4 bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap"><Send className="w-4 h-4 mr-2" /> E-mail</TabsTrigger>
              <TabsTrigger value="automations" className="py-2.5 px-4 whitespace-nowrap"><Zap className="w-4 h-4 mr-2" /> Automações</TabsTrigger>
              <TabsTrigger value="settings" className="py-2.5 px-4 ml-auto font-bold text-gray-700 bg-gray-100 whitespace-nowrap"><TrendingUp className="w-4 h-4 mr-2" /> Configurações</TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo das Abas */}
          <div className="min-h-[600px]">
            <TabsContent value="overview">
                <div className="max-w-7xl mx-auto">
                    <MarketingOverview />
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Atalhos Rápidos</h3>
                        <ContentManagerTab />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="flash_deals">
                <div className="max-w-7xl mx-auto">
                    <FlashDealManager />
                </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Máquina de Conteúdo SEO</h2>
                    </div>
                    <ContentManagerTab />
                    <div className="mt-8 pt-8 border-t">
                        <h3 className="text-lg font-bold mb-4 text-gray-700">Gerenciar Categorias</h3>
                        <BlogCategoryManager />
                    </div>
                </div>
            </TabsContent>
            
            <TabsContent value="traffic_matrix" className="space-y-6">
                <TrafficMatrix />
            </TabsContent>
            
            <TabsContent value="social">
                <div className="space-y-8">
                <SocialContentGenerator /> 
                <div className="pt-8 border-t max-w-4xl">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Configurações de Conexão</h3>
                    <IntegrationSettingsTab />
                </div>
                </div>
            </TabsContent>
            
            <TabsContent value="leads">
                <div className="max-w-7xl mx-auto space-y-6">
                <LeadCaptureTab />
                <LeadsListTab />
                </div>
            </TabsContent>
            
            <TabsContent value="broadcast">
                <EmailBroadcastTab />
            </TabsContent>

            <TabsContent value="automations">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <EmailAutomationTab />
                    <EmailTemplateManagerTab />
                </div>
            </TabsContent>
            
            <TabsContent value="settings">
                <div className="max-w-4xl mx-auto space-y-6">
                <IntegrationSettingsTab />
                <AdvancedMetricsTab />
                </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminMarketingCenter