import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Package,
  Filter,
  Printer,
  Mail,
  FileSpreadsheet,
  FilePieChart
} from 'lucide-react'

type ReportType = 'sales' | 'inventory' | 'users' | 'sellers' | 'financial'
type ReportFormat = 'pdf' | 'excel' | 'csv'

interface ReportConfig {
  type: ReportType
  title: string
  description: string
  icon: React.ReactNode
  metrics: string[]
}

const reportConfigs: ReportConfig[] = [
  {
    type: 'sales',
    title: 'Relatório de Vendas',
    description: 'Análise completa de vendas, receita e tendências',
    icon: <DollarSign className="w-6 h-6" />,
    metrics: ['Receita Total', 'Pedidos', 'Ticket Médio', 'Taxa de Conversão', 'Produtos Mais Vendidos']
  },
  {
    type: 'inventory',
    title: 'Relatório de Estoque',
    description: 'Status do inventário, produtos sem estoque e categorias',
    icon: <Package className="w-6 h-6" />,
    metrics: ['Total Produtos', 'Sem Estoque', 'Baixo Estoque', 'Categorias', 'Valor do Inventário']
  },
  {
    type: 'users',
    title: 'Relatório de Utilizadores',
    description: 'Crescimento, engajamento e comportamento dos usuários',
    icon: <Users className="w-6 h-6" />,
    metrics: ['Total Usuários', 'Novos', 'Ativos', 'Retenção', 'Tempo Médio na Plataforma']
  },
  {
    type: 'sellers',
    title: 'Relatório de Vendedores',
    description: 'Performance, comissões e top vendedores',
    icon: <TrendingUp className="w-6 h-6" />,
    metrics: ['Total Vendedores', 'Ativos', 'Comissões', 'Top Performers', 'Produtos por Vendedor']
  },
  {
    type: 'financial',
    title: 'Relatório Financeiro',
    description: 'Receitas, despesas, lucro e fluxo de caixa',
    icon: <BarChart3 className="w-6 h-6" />,
    metrics: ['Receita Bruta', 'Despesas', 'Lucro Líquido', 'Margem de Lucro', 'Comissões Pagas']
  }
]

const AdvancedReportsCenter: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [generating, setGenerating] = useState(false)

  const handleGenerateReport = async () => {
    if (!selectedReport) return

    setGenerating(true)

    // Simular geração de relatório
    setTimeout(() => {
      setGenerating(false)
      console.log('Relatório gerado:', { type: selectedReport, dateRange, format })
      alert('Relatório gerado com sucesso!')
    }, 2000)
  }

  const handleScheduleReport = () => {
    if (!selectedReport) return

    console.log('Agendar relatório:', { type: selectedReport, frequency: 'weekly' })
    alert('Relatório agendado para ser enviado semanalmente por email!')
  }

  const handleQuickReport = (type: ReportType) => {
    setSelectedReport(type)
    setGenerating(true)

    setTimeout(() => {
      setGenerating(false)
      console.log('Relatório rápido gerado:', type)
      alert('Relatório de ' + reportConfigs.find(r => r.type === type)?.title + ' gerado!')
    }, 1500)
  }

  const selectedConfig = reportConfigs.find(r => r.type === selectedReport)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Centro de Relatórios Avançados</h2>
        <p className="text-gray-600 mt-1">Gere e agende relatórios detalhados do marketplace</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {reportConfigs.map((config) => (
          <Card
            key={config.type}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => handleQuickReport(config.type)}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  {config.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{config.title}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Tipo de Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportConfigs.map((config) => (
                <button
                  key={config.type}
                  onClick={() => setSelectedReport(config.type)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedReport === config.type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={selectedReport === config.type ? 'text-white' : 'text-blue-600'}>
                      {config.icon}
                    </div>
                    <div>
                      <p className={`font-medium ${selectedReport === config.type ? 'text-white' : 'text-gray-900'}`}>
                        {config.title}
                      </p>
                      <p className={`text-xs ${selectedReport === config.type ? 'text-blue-100' : 'text-gray-500'}`}>
                        {config.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <>
              {/* Report Details */}
              <Card>
                <CardHeader>
                  <CardTitle>{selectedConfig?.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{selectedConfig?.description}</p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Métricas Incluídas:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedConfig?.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          <span className="text-gray-700">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Formato padrão:</span>
                      <span className="font-medium text-gray-900 uppercase">{format}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Período:</span>
                      <span className="font-medium text-gray-900">
                        {dateRange === '7d' ? 'Últimos 7 dias' :
                         dateRange === '30d' ? 'Últimos 30 dias' :
                         dateRange === '90d' ? 'Últimos 90 dias' :
                         'Personalizado'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Range Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Período do Relatório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Período Predefinido</Label>
                    <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Últimos 7 dias</SelectItem>
                        <SelectItem value="30d">Últimos 30 dias</SelectItem>
                        <SelectItem value="90d">Últimos 90 dias</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Data Início</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Data Fim</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Formato de Exportação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {(['pdf', 'excel', 'csv'] as ReportFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          format === fmt
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          {fmt === 'pdf' && <FilePieChart className="w-8 h-8 text-red-600" />}
                          {fmt === 'excel' && <FileSpreadsheet className="w-8 h-8 text-green-600" />}
                          {fmt === 'csv' && <FileText className="w-8 h-8 text-blue-600" />}
                          <span className={`font-medium text-sm ${format === fmt ? 'text-blue-600' : 'text-gray-700'}`}>
                            {fmt.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      onClick={handleGenerateReport}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {generating ? (
                        <>
                                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleScheduleReport}
                      variant="outline"
                      className="space-x-2"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Agendar por Email
                    </Button>

                    <Button
                      variant="outline"
                      className="space-x-2"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Agendamento Automático</h4>
                      <p className="text-sm text-blue-800">
                        Configure relatórios automáticos para serem gerados e enviados por email em intervalos regulares (diário, semanal ou mensal).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-12">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Selecione um tipo de relatório
                  </h3>
                  <p className="text-gray-600">
                    Escolha um dos tipos de relatório disponíveis para começar a configurar e gerar sua análise.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Relatório de Vendas - Fevereiro 2026', date: '28/02/2026', type: 'Vendas', status: 'Concluído' },
              { name: 'Relatório Financeiro - Janeiro 2026', date: '31/01/2026', type: 'Financeiro', status: 'Concluído' },
              { name: 'Relatório de Estoque - Semanal', date: '24/02/2026', type: 'Estoque', status: 'Concluído' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">{report.type} • {report.date}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvancedReportsCenter
