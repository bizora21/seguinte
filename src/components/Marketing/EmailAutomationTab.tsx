import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Mail, Settings, Send, ShoppingCart, Package, Users, Save, Loader2 } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'

interface Automation {
  id: string
  name: string
  description: string
  is_enabled: boolean
}

const EmailAutomationTab = () => {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      // Buscar automações
      const { data: automationsData, error: automationsError } = await supabase
        .from('email_automations')
        .select('*')
      if (automationsError) throw automationsError
      setAutomations(automationsData || [])

      // Buscar API Key (simulado, pois a chave está nos secrets)
      setApiKey('CONFIGURADO_NOS_SECRETS')

    } catch (error: any) {
      showError('Erro ao carregar configurações: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (id: string, checked: boolean) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_enabled: checked } : a))
  }

  const handleSave = async () => {
    setSaving(true)
    const toastId = showLoading('Salvando configurações...')
    try {
      const updates = automations.map(a => 
        supabase
          .from('email_automations')
          .update({ is_enabled: a.is_enabled })
          .eq('id', a.id)
      )
      
      await Promise.all(updates)
      
      dismissToast(toastId)
      showSuccess('Configurações de automação salvas com sucesso!')
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showError('Por favor, insira um e-mail de teste.')
      return
    }
    const toastId = showLoading('Enviando e-mail de teste...')
    try {
      const { error } = await supabase.functions.invoke('email-sender', {
        body: {
          to: testEmail,
          subject: 'Teste de E-mail da LojaRápida',
          html: '<h1>Olá!</h1><p>Este é um e-mail de teste enviado a partir do seu painel de administrador. A integração está a funcionar!</p>'
        }
      })

      if (error) throw error

      dismissToast(toastId)
      showSuccess('E-mail de teste enviado com sucesso!')
    } catch (error: any) {
      dismissToast(toastId)
      showError('Falha ao enviar e-mail: ' + error.message)
    }
  }

  const getIcon = (id: string) => {
    switch (id) {
      case 'welcome-series': return <Users className="w-5 h-5 text-blue-600" />
      case 'abandoned-cart': return <ShoppingCart className="w-5 h-5 text-red-600" />
      case 'reengagement': return <Mail className="w-5 h-5 text-purple-600" />
      case 'seller-onboarding': return <Package className="w-5 h-5 text-green-600" />
      default: return <Mail className="w-5 h-5" />
    }
  }

  if (loading) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin" /></div>
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
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="apiKey" className="font-medium flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Chave de API (Resend)
          </Label>
          <Input
            id="apiKey"
            type="text"
            value={apiKey}
            readOnly
            disabled
          />
          <p className="text-xs text-gray-500">A chave de API é gerida através dos Secrets do Supabase para maior segurança.</p>
        </div>

        <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Label htmlFor="testEmail" className="font-medium">Verificar Integração</Label>
          <div className="flex space-x-2">
            <Input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
            />
            <Button onClick={handleSendTestEmail}>Enviar Teste</Button>
          </div>
        </div>

        <h3 className="text-lg font-semibold border-b pb-2">Fluxos de Automação</h3>
        <div className="space-y-4">
          {automations.map((automation) => (
            <div key={automation.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getIcon(automation.id)}
                <div>
                  <p className="font-medium">{automation.name}</p>
                  <p className="text-sm text-gray-600">{automation.description}</p>
                </div>
              </div>
              <Switch
                checked={automation.is_enabled}
                onCheckedChange={(checked) => handleToggle(automation.id, checked)}
                disabled={saving}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações de Automação'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default EmailAutomationTab