import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Facebook, Instagram, Link, Save, Share2, Clock, Package, Users, CheckCircle, XCircle, Loader2, Calendar, TrendingUp } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'

// Simulação de dados de integração
const MOCK_INTEGRATION = {
  platform: 'facebook',
  isConnected: true,
  pageName: 'LojaRápida MZ',
  instagramAccount: '@lojarapida_mz',
  lastSync: new Date().toISOString(),
}

const MOCK_PRODUCTS = [
  { id: 'prod1', name: 'Smartphone Ultra Rápido MZ', price: 12500.00 },
  { id: 'prod2', name: 'Tênis Esportivo Leve', price: 3500.00 },
]

const SocialMediaIntegrationTab = () => {
  const [integration, setIntegration] = useState(MOCK_INTEGRATION)
  const [postMode, setPostMode] = useState<'product' | 'recruitment'>('product')
  const [selectedProductId, setSelectedProductId] = useState(MOCK_PRODUCTS[0].id)
  const [postContent, setPostContent] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedProduct = useMemo(() => MOCK_PRODUCTS.find(p => p.id === selectedProductId), [selectedProductId])

  const generateContent = () => {
    if (postMode === 'product' && selectedProduct) {
      const price = new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(selectedProduct.price)
      setPostContent(`✨ OFERTA RELÂMPAGO! ${selectedProduct.name} por apenas ${price}! Estoque limitado. Clique no link para encomendar agora! Pague na entrega em todo Moçambique! 🇲🇿 #LojaRapida #Oferta`)
    } else if (postMode === 'recruitment') {
      setPostContent(`🚀 RECRUTAMENTO DE VENDEDORES 🚀\n\nMonte sua loja digital na LojaRápida e alcance milhares de clientes em todo Moçambique! Oferecemos frete grátis e pagamento na entrega.\n\nCadastre-se agora: [Link para Cadastro de Vendedor]\n\n#VendaOnline #EmpreendedorismoMZ #LojaRapida`)
    }
  }

  const handleOAuthConnect = () => {
    // Simulação de fluxo OAuth
    showLoading('Iniciando conexão OAuth...')
    setTimeout(() => {
      dismissToast('loading')
      setIntegration({ ...MOCK_INTEGRATION, isConnected: true })
      showSuccess('Conexão com Facebook/Instagram estabelecida e tokens armazenados com segurança!')
    }, 2000)
  }
  
  const handlePostAction = async (isScheduled: boolean) => {
    if (!postContent.trim()) {
      showError('O conteúdo da publicação não pode estar vazio.')
      return
    }
    if (isScheduled && !scheduleTime) {
      showError('Selecione a data e hora para agendar.')
      return
    }
    
    setSubmitting(true)
    const action = isScheduled ? 'Agendando' : 'Publicando'
    const toastId = showLoading(`${action} post...`)

    try {
      // Chamada para a Edge Function
      const response = await supabase.functions.invoke('social-media-manager', {
        method: 'POST',
        body: {
          action: isScheduled ? 'schedule_post' : 'publish_now',
          content: postContent,
          scheduleTime: isScheduled ? scheduleTime : null,
          platform: 'facebook_instagram', // Plataforma consolidada
        },
        // Nota: O token de autenticação do usuário logado é enviado automaticamente
      })
      
      if (response.error) throw response.error
      
      dismissToast(toastId)
      showSuccess(`${action} com sucesso! Job ID: ${response.data.jobId || 'N/A'}`)
      setPostContent('')
      setScheduleTime('')
      
    } catch (error: any) {
      dismissToast(toastId)
      showError(`Falha ao ${action.toLowerCase()}: ${error.message || 'Erro de rede'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Link className="w-5 h-5 mr-2" />
            Status da Integração Social
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg flex items-center justify-between ${integration.isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center space-x-3">
              {integration.isConnected ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-gray-800">
                  {integration.isConnected ? 'Conectado' : 'Desconectado'}
                </p>
                <p className="text-sm text-gray-600">
                  {integration.isConnected ? `Página: ${integration.pageName} | Instagram: ${integration.instagramAccount}` : 'Conecte sua conta para automatizar posts.'}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleOAuthConnect} 
              variant={integration.isConnected ? 'outline' : 'default'}
              className={integration.isConnected ? 'text-gray-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {integration.isConnected ? 'Reconectar' : 'Conectar Facebook/Instagram'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gerador de Conteúdo e Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Share2 className="w-5 h-5 mr-2" />
            Gerador de Conteúdo e Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Modo de Criação */}
          <div className="space-y-2">
            <Label>Modo de Criação</Label>
            <Select value={postMode} onValueChange={(v: 'product' | 'recruitment') => setPostMode(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">
                  <Package className="w-4 h-4 mr-2 inline" /> Promoção de Produto (Clientes)
                </SelectItem>
                <SelectItem value="recruitment">
                  <Users className="w-4 h-4 mr-2 inline" /> Recrutamento de Vendedores
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Produto (se for modo produto) */}
          {postMode === 'product' && (
            <div className="space-y-2">
              <Label>Produto em Destaque</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PRODUCTS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Botão Gerar Conteúdo */}
          <Button onClick={generateContent} variant="outline" className="w-full">
            Gerar Legenda Otimizada
          </Button>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="postContent">Conteúdo da Publicação</Label>
            <Textarea
              id="postContent"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={5}
              placeholder="O conteúdo gerado aparecerá aqui..."
              disabled={submitting}
            />
          </div>

          {/* Agendamento */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="scheduleTime" className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Agendar Publicação (Opcional)
            </Label>
            <Input
              id="scheduleTime"
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex space-x-4 pt-2">
            <Button
              onClick={() => handlePostAction(false)}
              disabled={submitting || !integration.isConnected || !postContent.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {submitting && !scheduleTime ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
              Publicar Agora
            </Button>
            <Button
              onClick={() => handlePostAction(true)}
              disabled={submitting || !integration.isConnected || !postContent.trim() || !scheduleTime}
              variant="outline"
              className="flex-1"
            >
              {submitting && scheduleTime ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              Agendar Publicação
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Métricas (Simulação) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-2" />
            Métricas de Posts Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Alcance Médio (Produto)</p>
            <p className="text-xl font-bold text-blue-600">15.2K</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Engajamento Médio (Recrutamento)</p>
            <p className="text-xl font-bold text-green-600">4.1%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SocialMediaIntegrationTab