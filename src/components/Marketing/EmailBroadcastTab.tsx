import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Send, Users, Store, Mail, Loader2, ArrowRight, FileText, Eye } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { renderToStaticMarkup } from 'react-dom/server'
import EmailTemplate from '../Templates/EmailTemplate'
import { Profile } from '../../types/auth' // Importando o tipo Profile

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/BpqBKP5aUnS0U195dvM52p?mode=wwt'

const EmailBroadcastTab: React.FC = () => {
  const [targetAudience, setTargetAudience] = useState<'cliente' | 'vendedor' | ''>('')
  const [subject, setSubject] = useState('')
  const [bodyContent, setBodyContent] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const getRecipientName = (profile: Pick<Profile, 'email' | 'store_name'>) => {
    if (profile.store_name && targetAudience === 'vendedor') {
      return profile.store_name
    }
    return profile.email.split('@')[0]
  }

  const generateFullHtmlPreview = (name: string) => {
    const contentWithButtons = (
      <>
        <div dangerouslySetInnerHTML={{ __html: bodyContent.replace(/\n/g, '<br/>') }} />
        
        <div className="button-container">
          <a 
            href="https://lojarapidamz.com/produtos" 
            className="button button-primary"
            style={{ backgroundColor: '#00D4AA', color: '#ffffff', border: '1px solid #00D4AA' }}
          >
            🛒 Explorar Produtos Agora
          </a>
          <a 
            href={WHATSAPP_GROUP_LINK} 
            className="button button-secondary"
            style={{ backgroundColor: '#ffffff', color: '#0A2540', border: '1px solid #0A2540' }}
          >
            💬 Entrar no Grupo WhatsApp
          </a>
        </div>
      </>
    )

    return renderToStaticMarkup(
      <EmailTemplate 
        title={subject || 'Preview'} 
        previewText={previewText || subject}
        recipientName={name}
      >
        {contentWithButtons}
      </EmailTemplate>
    )
  }

  const handleSendBroadcast = async () => {
    if (!targetAudience || !subject.trim() || !bodyContent.trim()) {
      showError('Selecione o público-alvo, o assunto e o conteúdo do e-mail.')
      return
    }

    if (!confirm(`Tem certeza que deseja enviar este e-mail para TODOS os ${targetAudience === 'cliente' ? 'Clientes' : 'Vendedores'}?`)) {
      return
    }

    setSubmitting(true)
    const toastId = showLoading('Iniciando orquestração de envio em massa...')

    try {
      // 1. Buscar a lista de perfis do público-alvo
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('email, store_name')
        .eq('role', targetAudience)
        
      if (fetchError) throw fetchError
      
      const targetProfiles = profiles as Pick<Profile, 'email' | 'store_name'>[] || []
      
      if (targetProfiles.length === 0) {
        dismissToast(toastId)
        showError(`Nenhum e-mail encontrado para o público-alvo: ${targetAudience}.`)
        return
      }

      // 2. Preparar o envio (Simulação de envio individualizado)
      
      const testProfile = targetProfiles[0]
      const recipientName = getRecipientName(testProfile)

      // 3. Renderizar o template completo para o envio
      const htmlContent = generateFullHtmlPreview(recipientName)

      // 4. Chamar a Edge Function para enviar o e-mail (Simulação)
      
      const { error: sendError } = await supabase.functions.invoke('email-sender', {
        body: {
          to: testProfile.email, // Enviando apenas para o primeiro para simulação de teste
          subject: subject,
          html: htmlContent,
        }
      })

      if (sendError) throw sendError

      dismissToast(toastId)
      showSuccess(`Envio em massa orquestrado com sucesso! (Teste enviado para ${recipientName} em ${testProfile.email})`)
      
      // Limpar formulário
      setSubject('')
      setBodyContent('')
      setPreviewText('')
      setTargetAudience('')

    } catch (error: any) {
      dismissToast(toastId)
      console.error('Broadcast error:', error)
      showError('Falha ao enviar e-mail em massa: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Nome de placeholder para o preview
  const previewName = targetAudience === 'vendedor' ? '[Nome da Loja]' : '[Nome do Cliente]'
  const fullHtmlPreview = generateFullHtmlPreview(previewName)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-primary">
          <Mail className="w-6 h-6 mr-2" />
          Envio de E-mail Promocional (Broadcast)
        </CardTitle>
        <p className="text-sm text-gray-600">Crie e envie campanhas de marketing para Clientes ou Vendedores.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Público-Alvo */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="font-medium flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Público-Alvo *
          </Label>
          <Select value={targetAudience} onValueChange={(value: 'cliente' | 'vendedor') => setTargetAudience(value)}>
            <SelectTrigger id="targetAudience">
              <SelectValue placeholder="Selecione o público" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente">Clientes ({targetAudience === 'cliente' ? 'Lista Completa' : '...'})</SelectItem>
              <SelectItem value="vendedor">Vendedores ({targetAudience === 'vendedor' ? 'Lista Completa' : '...'})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assunto e Preview Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto do E-mail *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Ofertas Exclusivas de Primavera!"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="previewText">Texto de Pré-visualização (Opcional)</Label>
            <Input
              id="previewText"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Resumo que aparece na caixa de entrada"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Conteúdo do Corpo */}
        <div className="space-y-2">
          <Label htmlFor="bodyContent" className="font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Conteúdo do Corpo (HTML Simples / Texto) *
          </Label>
          <Textarea
            id="bodyContent"
            value={bodyContent}
            onChange={(e) => setBodyContent(e.target.value)}
            placeholder="Escreva sua mensagem promocional aqui. Use quebras de linha para parágrafos."
            rows={8}
            disabled={submitting}
          />
          <p className="text-xs text-gray-500">O conteúdo será automaticamente formatado em um template moderno.</p>
        </div>
        
        {/* Preview Completo usando iframe */}
        {bodyContent.trim() && (
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center text-blue-800">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Completo do E-mail
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <iframe
                        srcDoc={fullHtmlPreview}
                        title="Email Preview"
                        className="w-full border-0 rounded-b-lg"
                        style={{ height: '400px' }}
                    />
                </CardContent>
            </Card>
        )}

        {/* Botão de Envio */}
        <Button 
          onClick={handleSendBroadcast} 
          disabled={submitting || !targetAudience || !subject.trim() || !bodyContent.trim()}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Enviando E-mail em Massa...</>
          ) : (
            <><Send className="w-5 h-5 mr-2" /> Enviar Campanha Agora</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default EmailBroadcastTab