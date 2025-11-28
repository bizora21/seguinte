import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ArrowLeft, Zap, Users, Share2, TrendingUp, FileText, Send, LayoutDashboard, Database, Rocket } from 'lucide-react'
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
import ProgrammaticSEOManager from '../components/Marketing/ProgrammaticSEOManager' // NOVO IMPORT
import OAuthCallbackModal from '../components/Marketing/OAuthCallbackModal'

const AdminMarketingCenter = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const codeParam = searchParams.get('code')
  
  // Determinar aba inicial
  const getInitialTab = () => {
    // Se tiver code, não importa a aba, vamos processar. Depois voltamos para settings.
    if (codeParam) return 'settings'
    return searchParams.get('tab') || 'overview'
  }

  const [activeTab, setActiveTab] = useState(getInitialTab())

  // Sincronizar URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', value)
    
    // Limpar lixo de OAuth
    newParams.delete('code')
    newParams.delete('state')
    
    navigate({ search: newParams.toString() }, { replace: true })
  }

  const handleOAuthComplete = () => {
    console.log("OAuth Completo. Limpando estado...")
    
    // Forçar a remoção dos parâmetros da URL sem recarregar a página
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    url.searchParams.set('tab', 'settings')
    window.history.replaceState({}, '', url.toString())
    
    // Sincronizar estado do React Router
    setSearchParams({ tab: 'settings' })
    setActiveTab('settings')
    
    // Pequeno delay para garantir que o componente IntegrationSettingsTab remonte/atualize
    setTimeout(() => {
        window.dispatchEvent(new Event('oauth-success'))
    }, 100)
  }

  // INTERCEPTAÇÃO: Se houver código, mostra o modal SOBRE TUDO
  if (codeParam) {
    return (
        <OAuthCallbackModal 
            code={codeParam} 
            stateParam={searchParams.get('state')}
            onComplete={handleOAuthComplete}
        />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Principal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/admin')}
              className="mb-2 -ml-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Admin Dashboard
            </Button>
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Centro de Comando de Marketing</h1>
                <p className="text-gray-600 text-sm mt-1">Motor de Tráfego e Aquisição para Moçambique 🇲🇿</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
             <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center">
                <Database className="w-3 h-3 mr-1" /> Sistema v2.2 (Hyper-Growth)
             </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          
          {/* Navegação Principal */}
          <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-4">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-white border rounded-xl shadow-sm">
              <TabsTrigger value="overview" className="py-2.5 px-4"><LayoutDashboard className="w-4 h-4 mr-2" /> Visão Geral</TabsTrigger>
              <TabsTrigger value="content" className="py-2.5 px-4"><FileText className="w-4 h-4 mr-2" /> SEO & Blog</TabsTrigger>
              <TabsTrigger value="traffic_matrix" className="py-2.5 px-4"><Rocket className="w-4 h-4 mr-2" /> Matriz de Tráfego</TabsTrigger>
              <TabsTrigger value="social" className="py-2.5 px-4"><Share2 className="w-4 h-4 mr-2" /> Social</TabsTrigger>
              <TabsTrigger value="leads" className="py-2.5 px-4"><Users className="w-4 h-4 mr-2" /> Leads</TabsTrigger>
              <TabsTrigger value="broadcast" className="py-2.5 px-4"><Send className="w-4 h-4 mr-2" /> E-mail</TabsTrigger>
              <TabsTrigger value="automations" className="py-2.5 px-4"><Zap className="w-4 h-4 mr-2" /> Automações</TabsTrigger>
              <TabsTrigger value="settings" className="py-2.5 px-4 ml-auto font-bold text-blue-700 bg-blue-50/50"><TrendingUp className="w-4 h-4 mr-2" /> Configurações</TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo das Abas */}
          
          <TabsContent value="overview">
            <MarketingOverview />
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Atalhos Rápidos</h3>
                <ContentManagerTab />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Máquina de Conteúdo SEO</h2>
            </div>
            <ContentManagerTab />
            <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Gerenciar Categorias</h3>
                <BlogCategoryManager />
            </div>
          </TabsContent>
          
          {/* Nova Aba de Matriz */}
          <TabsContent value="traffic_matrix" className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Motor de Tráfego Programático</h2>
                    <p className="text-gray-600">Gere conteúdo em escala para dominar o Google em todas as cidades.</p>
                </div>
            </div>
            <ProgrammaticSEOManager />
            <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Como funciona?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-white border rounded-lg">
                        <span className="text-xl font-bold text-indigo-600">1. Combinação</span>
                        <p className="text-sm text-gray-600 mt-2">O sistema cruza cidades (ex: Maputo) com categorias (ex: Carros) para criar tópicos únicos.</p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg">
                        <span className="text-xl font-bold text-indigo-600">2. Geração AI</span>
                        <p className="text-sm text-gray-600 mt-2">A IA escreve um artigo otimizado para cada combinação, focado em SEO local.</p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg">
                        <span className="text-xl font-bold text-indigo-600">3. Indexação</span>
                        <p className="text-sm text-gray-600 mt-2">O Google indexa essas milhares de páginas, trazendo tráfego orgânico gratuito.</p>
                    </div>
                </div>
            </div>
          </TabsContent>
          
          <TabsContent value="social">
            <div className="space-y-8">
              <SocialContentGenerator /> 
              <div className="pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Configurações de Conexão</h3>
                <IntegrationSettingsTab />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="leads">
            <div className="space-y-6">
              <LeadCaptureTab />
              <LeadsListTab />
            </div>
          </TabsContent>
          
          <TabsContent value="broadcast">
            <EmailBroadcastTab />
          </TabsContent>

          <TabsContent value="automations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmailAutomationTab />
                <EmailTemplateManagerTab />
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Force remount if needed by adding a key, though usually fetch on mount is enough */}
              <IntegrationSettingsTab />
              <AdvancedMetricsTab />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default AdminMarketingCenter