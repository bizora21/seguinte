import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Mail, Settings, Send, ShoppingCart, Package, Users, Save } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'

interface Automation {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  isEnabled: boolean
  delay?: string
}

const initialAutomations: Automation[] = [
  {
    id: 'welcome-series',
    name: 'Série de Boas-vindas (Leads)',
    description: 'Sequência de 3 e-mails para novos leads capturados, apresentando a plataforma e ofertas.',
    icon: <Users className="w-5 h-5 text-blue-600" />,
    isEnabled: true,
    delay: '1 hora'
  },
  {
    id: 'abandoned-cart',
    name: 'Recuperação de Carrinho Abandonado',
    description: 'E-mail enviado 1 hora após o abandono do carrinho, com os produtos e CTA para finalizar.',
    icon: <ShoppingCart className="w-5 h-5 text-red-600" />,
    isEnabled: true,
    delay: '1 hora'
  },
  {
    id: 'reengagement',
    name: 'Campanha de Reengajamento',
    description: 'E-mail com cupom exclusivo para clientes que não compram há mais de 60 dias.',
    icon: <Mail className="w-5 h-5 text-purple-600" />,
    isEnabled: false,
    delay: '60 dias'
  },
  {
    id: 'seller-onboarding',
    name: 'Boas-vindas ao Vendedor',
    description: 'E-mail automático para novos vendedores com dicas de otimização de loja.',
    icon: <Package className="w-5 h-5 text-green-600" />,
    isEnabled: true,
    delay: 'Imediatamente'
  }
]

const EmailAutomationTab = () => {
  const [automations, setAutomations] = useState(initialAutomations)
  const [apiKey, setApiKey] = useState('SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx') // Simulação
  const [loading, setLoading] = useState(false)

  const handleToggle = (id: string, checked: boolean) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isEnabled: checked } : a))
  }

  const handleSave = () => {
    setLoading(true)
    // Simulação de salvamento no banco de dados
    setTimeout(() => {
      showSuccess('Configurações de automação salvas com sucesso!')
      setLoading(false)
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Send className="w-6 h-6 mr-2 text-primary" />
          E-mail Marketing e Automações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuração da API */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="apiKey" className="font-medium flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Chave de API (Resend/SendGrid)
          </Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Insira sua chave de API"
            disabled={loading}
          />
        </div>

        {/* Lista de Automações */}
        <h3 className="text-lg font-semibold border-b pb-2">Fluxos de Automação (Journeys)</h3>
        <div className="space-y-4">
          {automations.map((automation) => (
            <div key={automation.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {automation.icon}
                <div>
                  <p className="font-medium">{automation.name}</p>
                  <p className="text-sm text-gray-600">{automation.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Disparo: {automation.delay}</p>
                </div>
              </div>
              <Switch
                checked={automation.isEnabled}
                onCheckedChange={(checked) => handleToggle(automation.id, checked)}
                disabled={loading}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações de Automação'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default EmailAutomationTab