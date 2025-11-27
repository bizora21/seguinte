import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ArrowLeft, Zap, Users, Share2, TrendingUp, FileText, Send, LayoutDashboard } from 'lucide-react'
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

const AdminMarketingCenter = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Lógica inteligente para determinar a aba inicial
  const getInitialTab = () => {
    // 1. Prioridade: Se tem parâmetro 'tab' na URL
    const tabParam = searchParams.get('tab')
    if (tabParam) return tabParam
    
    // 2. Prioridade: Se está voltando do OAuth (tem 'code' e 'state')
    const codeParam = searchParams.get('code')
    const stateParam = searchParams.get('state')
    
    if (codeParam && stateParam) {
        try {
            const state = JSON.parse(decodeURIComponent(stateParam))
            if (state.tab) return state.tab
        } catch (e) {
            console.error("Erro ao ler state do OAuth:", e)
        }
        // Fallback seguro se não conseguir ler o state
        return 'settings'
    }
    
    // 3. Padrão
    return 'overview'
  }

  const [activeTab, setActiveTab] = useState(getInitialTab())

  // Sincronizar URL quando a aba muda manualmente
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // Atualiza a URL sem recarregar a página (limpa code/state se existirem)
    const newParams = new URLSearchParams()
    newParams.set('tab', value)
    navigate({ search: newParams.toString() }, { replace: true })
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
             <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
               <TrendingUp className="w-4 h-4 mr-2" />
               Relatório Semanal
             </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          
          {/* Navegação Principal */}
          <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-4">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-white border rounded-xl shadow-sm">
              <TabsTrigger value="overview" className="py-2.5 px-4 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="content" className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <FileText className="w-4 h-4 mr-2" /> SEO & Blog (Motor)
              </TabsTrigger>
              <TabsTrigger value="social" className="py-2.5 px-4 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                <Share2 className="w-4 h-4 mr-2" /> Social & WhatsApp
              </TabsTrigger>
              <TabsTrigger value="leads" className="py-2.5 px-4 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700">
                <Users className="w-4 h-4 mr-2" /> Captura de Leads
              </TabsTrigger>
              <TabsTrigger value="broadcast" className="py-2.5 px-4 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                <Send className="w-4 h-4 mr-2" /> Disparos (Email)
              </TabsTrigger>
              <TabsTrigger value="automations" className="py-2.5 px-4 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <Zap className="w-4 h-4 mr-2" /> Automações
              </TabsTrigger>
              <TabsTrigger value="settings" className="py-2.5 px-4 ml-auto">
                <TrendingUp className="w-4 h-4 mr-2" /> Configurações
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo das Abas */}
          
          <TabsContent value="overview" className="animate-in fade-in-50 duration-300">
            <MarketingOverview />
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Atalhos Rápidos</h3>
                <ContentManagerTab />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Máquina de Conteúdo SEO</h2>
                <p className="text-sm text-gray-500">Foco: Google Discover e Primeiras Posições</p>
            </div>
            <ContentManagerTab />
            <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Gerenciar Categorias</h3>
                <BlogCategoryManager />
            </div>
          </TabsContent>
          
          <TabsContent value="social" className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
              <SocialContentGenerator /> 
              <div className="pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Configurações de Conexão (OAuth)</h3>
                <IntegrationSettingsTab />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="leads" className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <LeadCaptureTab />
              <LeadsListTab />
            </div>
          </TabsContent>
          
          <TabsContent value="broadcast" className="animate-in slide-in-from-bottom-4 duration-500">
            <EmailBroadcastTab />
          </TabsContent>

          <TabsContent value="automations" className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmailAutomationTab />
                <EmailTemplateManagerTab />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
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