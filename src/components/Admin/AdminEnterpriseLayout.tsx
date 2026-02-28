import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  DollarSign,
  Settings,
  FileText,
  Zap,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  TrendingUp,
  BrainCircuit,
  Puzzle,
  Briefcase,
  Shield,
  Activity,
  LogOut,
  HelpCircle
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  badge?: number
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard/admin'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/dashboard/admin/analytics',
    badge: 3
  },
  {
    id: 'products',
    label: 'Produtos',
    icon: <Package className="w-5 h-5" />,
    children: [
      { id: 'bulk-products', label: 'Gestão em Massa', icon: <Layers className="w-4 h-4" />, path: '/dashboard/admin/bulk-products' },
      { id: 'categories', label: 'Categorias', icon: <Folder className="w-4 h-4" />, path: '/dashboard/admin/categories' },
      { id: 'inventory', label: 'Estoque', icon: <Package className="w-4 h-4" />, path: '/dashboard/admin/inventory' }
    ]
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: <ShoppingCart className="w-5 h-5" />,
    badge: 23,
    children: [
      { id: 'all-orders', label: 'Todos os Pedidos', icon: <List className="w-4 h-4" />, path: '/dashboard/admin/orders' },
      { id: 'pending', label: 'Pendentes', icon: <Clock className="w-4 h-4" />, path: '/dashboard/admin/orders/pending' },
      { id: 'shipping', label: 'Em Transporte', icon: <Truck className="w-4 h-4" />, path: '/dashboard/admin/orders/shipping' }
    ]
  },
  {
    id: 'users',
    label: 'Utilizadores',
    icon: <Users className="w-5 h-5" />,
    children: [
      { id: 'all-users', label: 'Todos', icon: <Users className="w-4 h-4" />, path: '/dashboard/admin/users' },
      { id: 'sellers', label: 'Vendedores', icon: <Briefcase className="w-4 h-4" />, path: '/dashboard/admin/sellers' },
      { id: 'buyers', label: 'Compradores', icon: <ShoppingBag className="w-4 h-4" />, path: '/dashboard/admin/buyers' }
    ]
  },
  {
    id: 'financial',
    label: 'Financeiro',
    icon: <DollarSign className="w-5 h-5" />,
    children: [
      { id: 'revenue', label: 'Receitas', icon: <TrendingUp className="w-4 h-4" />, path: '/dashboard/admin/financial/revenue' },
      { id: 'commissions', label: 'Comissões', icon: <Percent className="w-4 h-4" />, path: '/dashboard/admin/financial/commissions' },
      { id: 'payouts', label: 'Pagamentos', icon: <CreditCard className="w-4 h-4" />, path: '/dashboard/admin/financial/payouts' }
    ]
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: <FileText className="w-5 h-5" />,
    path: '/dashboard/admin/reports'
  },
  {
    id: 'automations',
    label: 'Automações',
    icon: <Zap className="w-5 h-5" />,
    path: '/dashboard/admin/automations',
    badge: 8
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <Megaphone className="w-5 h-5" />,
    path: '/dashboard/admin/marketing'
  },
  {
    id: 'intelligence',
    label: 'NEXUS AI',
    icon: <BrainCircuit className="w-5 h-5 text-cyan-600" />,
    path: '/dashboard/admin/intelligence'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: <Settings className="w-5 h-5" />,
    children: [
      { id: 'general', label: 'Geral', icon: <Settings className="w-4 h-4" />, path: '/dashboard/admin/settings/general' },
      { id: 'team', label: 'Equipe', icon: <Users className="w-4 h-4" />, path: '/dashboard/admin/settings/team' },
      { id: 'security', label: 'Segurança', icon: <Shield className="w-4 h-4" />, path: '/dashboard/admin/settings/security' }
    ]
  }
]

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

const AdminEnterpriseLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo & Menu Toggle */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#0A2540] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="font-bold text-gray-900">LojaRápida Admin</span>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos, pedidos, usuários..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                5
              </span>
            </Button>

            <Button variant="ghost" size="sm">
              <HelpCircle className="w-5 h-5" />
            </Button>

            <div className="w-px h-8 bg-gray-200 mx-2" />

            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <LogOut className="w-5 h-5 text-red-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <nav className="h-full overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <div key={item.id}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleSection(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSections.has(item.id) ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {expandedSections.has(item.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => child.path && handleNavigation(child.path)}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => item.path && handleNavigation(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminEnterpriseLayout
