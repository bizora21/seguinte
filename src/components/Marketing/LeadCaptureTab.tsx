import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Zap, Settings, Clock, MousePointerClick, ScrollText, Save } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'

// Simulação de estado global de configuração de pop-up (em um sistema real, isso seria salvo no Supabase)
const initialConfig = {
  isEnabled: true,
  incentive: 'Ganhe 10% de desconto na primeira compra!',
  trigger: 'exit-intent', // 'exit-intent', 'time-on-page', 'scroll-depth'
  triggerValue: '30', // 30 segundos ou 50% de rolagem
}

const LeadCaptureTab = () => {
  const [config, setConfig] = useState(initialConfig)
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)
    // Simulação de salvamento no banco de dados
    setTimeout(() => {
      showSuccess('Configurações de Pop-up salvas com sucesso!')
      setLoading(false)
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Zap className="w-6 h-6 mr-2 text-yellow-600" />
          Configuração de Pop-up Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="enable-popup" className="text-base font-medium">
            Pop-up de Captura de Leads Ativo
          </Label>
          <Switch
            id="enable-popup"
            checked={config.isEnabled}
            onCheckedChange={(checked) => setConfig({ ...config, isEnabled: checked })}
            disabled={loading}
          />
        </div>

        {/* Incentivo */}
        <div className="space-y-2">
          <Label htmlFor="incentive">Incentivo do Pop-up</Label>
          <Input
            id="incentive"
            value={config.incentive}
            onChange={(e) => setConfig({ ...config, incentive: e.target.value })}
            placeholder="Ex: Ganhe 10% de desconto!"
            disabled={loading}
          />
        </div>

        {/* Gatilho */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trigger">Gatilho de Exibição</Label>
            <Select
              value={config.trigger}
              onValueChange={(value) => setConfig({ ...config, trigger: value, triggerValue: value === 'exit-intent' ? '' : '30' })}
              disabled={loading}
            >
              <SelectTrigger id="trigger">
                <SelectValue placeholder="Selecione o gatilho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exit-intent">
                  <MousePointerClick className="w-4 h-4 mr-2 inline" />
                  Exit-Intent (Intenção de Saída)
                </SelectItem>
                <SelectItem value="time-on-page">
                  <Clock className="w-4 h-4 mr-2 inline" />
                  Tempo na Página (Segundos)
                </SelectItem>
                <SelectItem value="scroll-depth">
                  <ScrollText className="w-4 h-4 mr-2 inline" />
                  Profundidade de Rolagem (%)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.trigger !== 'exit-intent' && (
            <div className="space-y-2">
              <Label htmlFor="triggerValue">
                Valor do Gatilho ({config.trigger === 'time-on-page' ? 'Segundos' : '%'})
              </Label>
              <Input
                id="triggerValue"
                type="number"
                min={config.trigger === 'scroll-depth' ? 10 : 5}
                max={config.trigger === 'scroll-depth' ? 100 : 120}
                value={config.triggerValue}
                onChange={(e) => setConfig({ ...config, triggerValue: e.target.value })}
                disabled={loading}
              />
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default LeadCaptureTab