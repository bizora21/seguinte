import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bot,
  Zap,
  Bell,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit,
  Settings,
  AlertTriangle,
  Sparkles,
  Workflow,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface Automation {
  id: string
  name: string
  type: 'notification' | 'email' | 'workflow' | 'ai_insight'
  trigger: string
  action: string
  status: 'active' | 'paused'
  lastRun?: Date
  successRate: number
}

interface AutomationTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'sales' | 'inventory' | 'users' | 'financial'
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

const automationTemplates: AutomationTemplate[] = [
  {
    id: 'welcome_email',
    name: 'Email de Boas-vindas',
    description: 'Envia email automático para novos usuários se cadastrarem',
    icon: <Mail className="w-6 h-6" />,
    category: 'users',
    difficulty: 'basic'
  },
  {
    id: 'low_stock_alert',
    name: 'Alerta de Estoque Baixo',
    description: 'Notifica vendedores quando produtos estão com stock baixo',
    icon: <Package className="w-6 h-6" />,
    category: 'inventory',
    difficulty: 'basic'
  },
  {
    id: 'abandoned_cart',
    name: 'Recuperação de Carrinho Abandonado',
    description: 'Envia lembrete para usuários que abandonaram o carrinho',
    icon: <ShoppingCart className="w-6 h-6" />,
    category: 'sales',
    difficulty: 'intermediate'
  },
  {
    id: 'daily_sales_report',
    name: 'Relatório Diário de Vendas',
    description: 'Envia relatório automático de vendas para administradores',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'financial',
    difficulty: 'intermediate'
  },
  {
    id: 'price_adjustment',
    name: 'Ajuste Dinâmico de Preços',
    description: 'Ajusta preços automaticamente baseado na demanda',
    icon: <DollarSign className="w-6 h-6" />,
    category: 'sales',
    difficulty: 'advanced'
  },
  {
    id: 'vip_customer',
    name: 'Detecção de Clientes VIP',
    description: 'Identifica e marca clientes de alto valor automaticamente',
    icon: <Sparkles className="w-6 h-6" />,
    category: 'users',
    difficulty: 'advanced'
  },
  {
    id: 'fraud_detection',
    name: 'Detecção de Fraudes',
    description: 'Analisa pedidos em tempo real e alerta sobre atividades suspeitas',
    icon: <AlertTriangle className="w-6 h-6" />,
    category: 'financial',
    difficulty: 'advanced'
  },
  {
    id: 'seller_performance',
    name: 'Análise de Performance de Vendedores',
    description: 'Avalia e ranqueia vendedores baseado em métricas',
    icon: <TrendingUp className="w-6 h-6" />,
    category: 'sales',
    difficulty: 'intermediate'
  }
]

const AutomationCenter: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Alerta de Estoque Baixo',
      type: 'notification',
      trigger: 'Stock < 10 unidades',
      action: 'Notificar vendedor por email',
      status: 'active',
      lastRun: new Date('2026-02-28T10:30:00'),
      successRate: 98
    },
    {
      id: '2',
      name: 'Relatório Diário de Vendas',
      type: 'email',
      trigger: 'Todos os dias às 08:00',
      action: 'Enviar relatório para admin@lojarapida.mz',
      status: 'active',
      lastRun: new Date('2026-02-28T08:00:00'),
      successRate: 100
    },
    {
      id: '3',
      name: 'Email de Boas-vindas',
      type: 'email',
      trigger: 'Novo usuário cadastrado',
      action: 'Enviar email de boas-vindas',
      status: 'active',
      successRate: 99
    },
    {
      id: '4',
      name: 'Detecção de Fraudes',
      type: 'workflow',
      trigger: 'Pedido > 50.000 MZN',
      action: 'Análise de risco + aprovação manual',
      status: 'paused',
      successRate: 95
    }
  ])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const handleToggleStatus = (id: string) => {
    setAutomations(automations.map(auto => {
      if (auto.id === id) {
        return {
          ...auto,
          status: auto.status === 'active' ? 'paused' : 'active'
        }
      }
      return auto
    }))
  }

  const handleDeleteAutomation = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta automação?')) {
      setAutomations(automations.filter(auto => auto.id !== id))
    }
  }

  const handleCreateFromTemplate = (template: AutomationTemplate) => {
    setSelectedTemplate(template)
    setShowCreateModal(true)
  }

  const filteredAutomations = automations.filter(auto => {
    const matchesStatus = filter === 'all' || auto.status === filter
    return matchesStatus
  })

  const filteredTemplates = automationTemplates.filter(template => {
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    return matchesCategory
  })

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center w-fit">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativa
      </span>
    ) : (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center w-fit">
        <Pause className="w-3 h-3 mr-1" />
        Pausada
      </span>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <Bell className="w-4 h-4 text-yellow-600" />
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />
      case 'workflow':
        return <Workflow className="w-4 h-4 text-purple-600" />
      case 'ai_insight':
        return <Sparkles className="w-4 h-4 text-pink-600" />
      default:
        return <Bot className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro de Automações</h2>
          <p className="text-gray-600 mt-1">Automatize processos e workflows inteligentes</p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nova Automação</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Automações</p>
                <p className="text-2xl font-bold text-gray-900">{automations.length}</p>
              </div>
              <Bot className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{automations.filter(a => a.status === 'active').length}</p>
              </div>
              <Play className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Execuções Hoje</p>
                <p className="text-2xl font-bold text-purple-600">1.2K</p>
              </div>
              <Zap className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                onClick={() => setFilter('active')}
              >
                Ativas
              </Button>
              <Button
                variant={filter === 'paused' ? 'default' : 'outline'}
                onClick={() => setFilter('paused')}
              >
                Pausadas
              </Button>
            </div>

            <div className="flex-1" />

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="inventory">Estoque</SelectItem>
                <SelectItem value="users">Usuários</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Automations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Automações Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAutomations.map((automation) => (
              <div key={automation.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-white rounded-lg">
                      {getTypeIcon(automation.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{automation.name}</h4>
                        {getStatusBadge(automation.status)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Quando:</strong> {automation.trigger}</p>
                        <p><strong>Ação:</strong> {automation.action}</p>
                      </div>

                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Taxa de sucesso: <strong className={automation.successRate >= 95 ? 'text-green-600' : 'text-yellow-600'}>{automation.successRate}%</strong></span>
                        {automation.lastRun && (
                          <span>Última exec: {automation.lastRun.toLocaleString('pt-MZ')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(automation.id)}
                      title={automation.status === 'active' ? 'Pausar' : 'Ativar'}
                    >
                      {automation.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>

                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAutomation(automation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Templates de Automação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => handleCreateFromTemplate(template)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {template.icon}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                        template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {template.difficulty === 'basic' ? 'Básico' :
                         template.difficulty === 'intermediate' ? 'Intermediário' :
                         'Avançado'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{template.category}</span>
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {selectedTemplate ? `Configurar: ${selectedTemplate.name}` : 'Nova Automação'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">{selectedTemplate.description}</p>
                </div>
              )}

              <div>
                <Label htmlFor="automationName">Nome da Automação</Label>
                <Input
                  id="automationName"
                  placeholder={selectedTemplate?.name || 'Ex: Alerta de Estoque Baixo'}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="trigger">Gatilho (Trigger)</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_low">Estoque abaixo de X unidades</SelectItem>
                    <SelectItem value="new_user">Novo usuário cadastrado</SelectItem>
                    <SelectItem value="abandoned_cart">Carrinho abandonado</SelectItem>
                    <SelectItem value="daily">Diariamente em horário específico</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="action">Ação</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Enviar Email</SelectItem>
                    <SelectItem value="notification">Enviar Notificação</SelectItem>
                    <SelectItem value="webhook">Chamar Webhook</SelectItem>
                    <SelectItem value="update">Atualizar Registro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" />
                <Label htmlFor="active">Ativar automaticamente após criar</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false)
                  setSelectedTemplate(null)
                }}>
                  Cancelar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Criar Automação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AutomationCenter
