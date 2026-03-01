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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex flex-col">
      <div className={`mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 ${isFullWidth ? 'max-w-[1920px]' : 'max-w-7xl'}`}>

        {/* Header Profissional Melhorado */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center flex-1">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/admin')}
                className="mr-4 text-gray-600 hover:text-gray-900 h-10 w-10 p-0 rounded-full hover:bg-gray-100 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0A2540] via-purple-600 to-[#0A2540] bg-clip-text text-transparent">
                    Centro de Marketing
                  </h1>
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-md flex items-center">
                      <Database className="w-3 h-3 mr-1" /> Pro v3.0
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-md flex items-center">
                      <Rocket className="w-3 h-3 mr-1" /> Enterprise
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mt-2 text-sm">
                  Automações de marketing, SEO avançado e crescimento para todo Moçambique
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Sistema Online
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div>Versão 3.0 Enterprise</div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Tempo Real
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

          {/* Navegação Principal com Gradientes Coloridos */}
          <div className="sticky top-0 z-30 bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 pb-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent no-scrollbar">
                <TabsTrigger value="overview" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-100 data-[state=active]:to-gray-200">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Visão Geral
                </TabsTrigger>
                <TabsTrigger value="social" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-100 data-[state=active]:to-purple-100">
                  <Share2 className="w-4 h-4 mr-2" /> Social
                </TabsTrigger>
                <TabsTrigger value="flash_deals" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-100 data-[state=active]:to-red-100">
                  <Timer className="w-4 h-4 mr-2" /> Flash Sales
                </TabsTrigger>
                <TabsTrigger value="content" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-100 data-[state=active]:to-cyan-100">
                  <FileText className="w-4 h-4 mr-2" /> SEO & Blog
                </TabsTrigger>
                <TabsTrigger value="traffic_matrix" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-100 data-[state=active]:to-emerald-100">
                  <Rocket className="w-4 h-4 mr-2" /> Matriz SEO
                </TabsTrigger>
                <TabsTrigger value="leads" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-100 data-[state=active]:to-amber-100">
                  <Users className="w-4 h-4 mr-2" /> Leads
                </TabsTrigger>
                <TabsTrigger value="broadcast" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-100 data-[state=active]:to-indigo-100">
                  <Send className="w-4 h-4 mr-2" /> E-mail
                </TabsTrigger>
                <TabsTrigger value="automations" className="py-3 px-4 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-pink-100">
                  <Zap className="w-4 h-4 mr-2" /> Automações
                </TabsTrigger>
                <TabsTrigger value="settings" className="py-3 px-4 ml-auto whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-200 data-[state=active]:to-gray-300">
                  <TrendingUp className="w-4 h-4 mr-2" /> Configurações
                </TabsTrigger>
              </TabsList>
            </div>
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