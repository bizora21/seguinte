import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Package, AlertCircle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface AnalyticsData {
  revenue: {
    total: number
    growth: number
    period: string
  }
  orders: {
    total: number
    pending: number
    completed: number
    cancelled: number
    growth: number
  }
  users: {
    total: number
    active: number
    new: number
    growth: number
  }
  products: {
    total: number
    active: number
    outOfStock: number
    growth: number
  }
  conversionRate: {
    value: number
    growth: number
  }
  avgOrderValue: {
    value: number
    growth: number
  }
}

interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend, subtitle }) => {
  const isPositive = change > 0
  const trendIcon = isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="p-2 bg-blue-50 rounded-lg">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="flex items-center mt-2 space-x-2">
          <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trendIcon}
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-gray-500">vs período anterior</span>
        </div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

interface ChartData {
  name: string
  value: number
}

const SimpleBarChart: React.FC<{ data: ChartData[]; color?: string }> = ({ data, color = '#3B82F6' }) => {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-24 text-sm text-gray-600 truncate">{item.name}</div>
          <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: color
              }}
            />
          </div>
          <div className="w-16 text-sm font-medium text-right text-gray-900">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

const SimpleLineChart: React.FC<{ data: { day: string; value: number }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (d.value / maxValue) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="relative h-48 w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
        ))}

        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="rgba(59, 130, 246, 0.1)"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100
          const y = 100 - (d.value / maxValue) * 100
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="0.5"
            />
          )
        })}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
        {data.map((d, i) => (
          <span key={i} className={i % 2 === 0 ? '' : 'hidden'}>{d.day}</span>
        ))}
      </div>
    </div>
  )
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setData({
        revenue: {
          total: 2450000,
          growth: 23.5,
          period: '30 dias'
        },
        orders: {
          total: 3420,
          pending: 234,
          completed: 2987,
          cancelled: 199,
          growth: 18.2
        },
        users: {
          total: 12500,
          active: 8500,
          new: 1200,
          growth: 31.4
        },
        products: {
          total: 8500,
          active: 7200,
          outOfStock: 450,
          growth: 12.8
        },
        conversionRate: {
          value: 3.8,
          growth: 0.6
        },
        avgOrderValue: {
          value: 716,
          growth: 4.2
        }
      })
      setLoading(false)
    }, 1500)
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-MZ').format(value)
  }

  // Dados de exemplo para gráficos
  const revenueData = [
    { name: 'Segunda', value: 320000 },
    { name: 'Terça', value: 380000 },
    { name: 'Quarta', value: 290000 },
    { name: 'Quinta', value: 420000 },
    { name: 'Sexta', value: 510000 },
    { name: 'Sábado', value: 340000 },
    { name: 'Domingo', value: 190000 }
  ]

  const weeklyTrend = [
    { day: 'Seg', value: 320000 },
    { day: 'Ter', value: 380000 },
    { day: 'Qua', value: 290000 },
    { day: 'Qui', value: 420000 },
    { day: 'Sex', value: 510000 },
    { day: 'Sáb', value: 340000 },
    { day: 'Dom', value: 190000 }
  ]

  const topCategories = [
    { name: 'Eletrónicos', value: 520000 },
    { name: 'Moda', value: 380000 },
    { name: 'Casa', value: 290000 },
    { name: 'Beleza', value: 180000 },
    { name: 'Esportes', value: 120000 }
  ]

  const topProducts = [
    { name: 'Smartphone Samsung', value: 45 },
    { name: 'Notebook Dell', value: 32 },
    { name: 'Tênis Nike', value: 28 },
    { name: 'Fritadeira Elétrica', value: 24 },
    { name: 'Kit Ferramentas', value: 19 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h2>
          <p className="text-gray-600 mt-1">Visão geral completa do desempenho do marketplace</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={formatCurrency(data.revenue.total)}
          change={data.revenue.growth}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          trend={data.revenue.growth > 0 ? 'up' : 'down'}
          subtitle={`${data.orders.total} encomendas`}
        />
        <StatCard
          title="Encomendas"
          value={formatNumber(data.orders.total)}
          change={data.orders.growth}
          icon={<ShoppingBag className="w-5 h-5 text-green-600" />}
          trend={data.orders.growth > 0 ? 'up' : 'down'}
          subtitle={`${data.orders.completed} concluídas`}
        />
        <StatCard
          title="Utilizadores"
          value={formatNumber(data.users.total)}
          change={data.users.growth}
          icon={<Users className="w-5 h-5 text-purple-600" />}
          trend={data.users.growth > 0 ? 'up' : 'down'}
          subtitle={`${data.users.active} ativos`}
        />
        <StatCard
          title="Produtos"
          value={formatNumber(data.products.total)}
          change={data.products.growth}
          icon={<Package className="w-5 h-5 text-orange-600" />}
          trend={data.products.growth > 0 ? 'up' : 'down'}
          subtitle={`${data.products.active} ativos`}
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{data.conversionRate.value}%</div>
                <div className={`text-sm font-medium mt-1 ${data.conversionRate.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.conversionRate.growth > 0 ? '+' : ''}{data.conversionRate.growth}% vs anterior
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Visitantes: 125.4K</div>
                <div>Conversões: 4.8K</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valor Médio do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.avgOrderValue.value)}</div>
                <div className={`text-sm font-medium mt-1 ${data.avgOrderValue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.avgOrderValue.growth > 0 ? '+' : ''}{data.avgOrderValue.growth}% vs anterior
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Pedidos: {formatNumber(data.orders.total)}</div>
                <div>Receita: {formatCurrency(data.revenue.total)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Receita */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendência de Receita (Última Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={weeklyTrend} />
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-gray-600">Total da semana: {formatCurrency(data.revenue.total)}</span>
              <span className="text-green-600 font-medium">+23.5% vs semana anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Categorias Top */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias Mais Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={topCategories} color="#3B82F6" />
            <div className="mt-4 text-sm text-gray-600">
              Total: {formatCurrency(topCategories.reduce((sum, cat) => sum + cat.value, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
            Alertas e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{data.orders.pending} encomendas pendentes</p>
                <p className="text-sm text-gray-600">Ação necessária: Atribuir vendedores ou processar cancelamentos</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <Package className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{data.products.outOfStock} produtos sem stock</p>
                <p className="text-sm text-gray-600">Recomendação: Notificar vendedores para repor stock</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Crescimento positivo de {data.users.growth}%</p>
                <p className="text-sm text-gray-600">Insight: Campanhas de marketing estão performando bem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="text-gray-900 font-medium">{product.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{product.value} vendas</div>
                  <div className="text-sm text-gray-500">{formatCurrency(product.value * 716)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvancedAnalyticsDashboard
