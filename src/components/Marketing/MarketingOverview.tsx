import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ArrowUpRight, Users, MousePointerClick, Share2, Zap, Smartphone } from 'lucide-react'
import { Button } from '../ui/button'

const MarketingOverview = () => {
  // Dados simulados para a interface visual (seriam reais via Supabase Analytics)
  const metrics = [
    {
      title: "Novos Leads (Hoje)",
      value: "24",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Tráfego Orgânico",
      value: "1.2k",
      change: "+8.5%",
      icon: MousePointerClick,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Alcance Social",
      value: "45k",
      change: "+22%",
      icon: Share2,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "+0.4%",
      icon: Zap,
      color: "text-yellow-600",
      bg: "bg-yellow-50"
    }
  ]

  return (
    <div className="space-y-6 mb-8">
      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${metric.bg}`}>
                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
                  </div>
                </div>
                <div className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {metric.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações Rápidas de Dominância */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#0A2540] to-[#1a3b5c] text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-medium text-green-400">
              <Zap className="w-5 h-5 mr-2" />
              Motor de Tráfego Imediato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4 text-sm">
              Gere um "Buzz" instantâneo. Cria conteúdo para Blog, Facebook e WhatsApp simultaneamente.
            </p>
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold border-0">
              Iniciar Campanha Relâmpago
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-green-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Smartphone className="w-5 h-5 mr-2 text-green-600" />
              WhatsApp Blast (Moçambique)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">
              O canal mais forte de MZ. Prepare textos curtos e diretos para listas de transmissão.
            </p>
            <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
              Gerar Texto WhatsApp
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-purple-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Share2 className="w-5 h-5 mr-2 text-purple-600" />
              Automação Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">
              Agende posts para a semana toda no Facebook e Instagram com um clique.
            </p>
            <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50">
              Abrir Calendário
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MarketingOverview