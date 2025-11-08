import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ArrowLeft, Zap, Users, Send, Share2, Calendar, TrendingUp, Clock, MousePointerClick, Link, Settings, Globe, FileText, Target, ArrowRight, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import LeadCaptureTab from '../components/Marketing/LeadCaptureTab'
import EmailAutomationTab from '../components/Marketing/EmailAutomationTab'
import SocialMediaIntegrationTab from '../components/Marketing/SocialMediaIntegrationTab'
import AdvancedMetricsTab from '../components/Marketing/AdvancedMetricsTab'
import IntegrationSettingsTab from '../components/Marketing/IntegrationSettingsTab'
import ContentManagerTab from '../components/Marketing/ContentManagerTab'
import BlogCategoryManager from '../components/Marketing/BlogCategoryManager'

const AdminMarketingCenter = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'content'

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/admin')}
              className="mb-2 -ml-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Admin Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Zap className="w-8 h-8 mr-3 text-yellow-600" />
              Centro de Marketing
            </h1>
            <p className="text-gray-600 mt-1">Gerencie SEO, automações e campanhas de aquisição.</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
            <TabsTrigger value="content" className="py-2 text-xs sm:text-sm flex items-center">
              <FileText className="w-4 h-4 mr-1" /> Conteúdo & SEO
            </TabsTrigger>
            <TabsTrigger value="categories" className="py-2 text-xs sm:text-sm flex items-center">
              <Tag className="w-4 h-4 mr-1" /> Categorias
            </TabsTrigger>
            <TabsTrigger value="leads" className="py-2 text-xs sm:text-sm flex items-center">
              <Users className="w-4 h-4 mr-1" /> Leads & Pop-up
            </TabsTrigger>
            <TabsTrigger value="social" className="py-2 text-xs sm:text-sm flex items-center">
              <Share2 className="w-4 h-4 mr-1" /> Social & Email
            </TabsTrigger>
            <TabsTrigger value="metrics" className="py-2 text-xs sm:text-sm flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> Métricas Avançadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ContentManagerTab />
          </TabsContent>
          
          <TabsContent value="categories">
            <BlogCategoryManager />
          </TabsContent>
          
          <TabsContent value="leads">
            <LeadCaptureTab />
          </TabsContent>

          <TabsContent value="social">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SocialMediaIntegrationTab />
              <EmailAutomationTab />
            </div>
          </TabsContent>
          
          <TabsContent value="metrics">
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