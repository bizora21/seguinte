import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Zap, Target, Globe, Loader2 } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const CONTEXT_OPTIONS = [
  { value: 'maputo', label: 'Maputo e Região' },
  { value: 'beira', label: 'Beira e Sofala' },
  { value: 'nampula', label: 'Nampula e Norte' },
  { value: 'nacional', label: 'Nacional (Todo MZ)' },
]

const AUDIENCE_OPTIONS = [
  { value: 'vendedores', label: 'Vendedores e Empreendedores' },
  { value: 'clientes', label: 'Consumidores e Compradores' },
  { value: 'geral', label: 'Público Geral' },
]

const TYPE_OPTIONS = [
  { value: 'guia-completo', label: 'Guia Completo' },
  { value: 'dicas-praticas', label: 'Dicas Práticas' },
  { value: 'tendencias', label: 'Análise de Tendências' },
]

// URL ABSOLUTA DA EDGE FUNCTION
const CONTENT_GENERATOR_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator'

interface ContentGenerationControlsProps {
  onContentGenerated: (draftId: string) => void
  onSetTab: (tab: string) => void
}

const ContentGenerationControls: React.FC<ContentGenerationControlsProps> = ({ onContentGenerated, onSetTab }) => {
  const { user } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [context, setContext] = useState('maputo')
  const [audience, setAudience] = useState('vendedores')
  const [contentType, setContentType] = useState('guia-completo')
  const [generating, setGenerating] = useState(false)

  const generateContent = async () => {
    if (!keyword.trim()) {
      showError('Por favor, insira uma palavra-chave principal.')
      return
    }

    setGenerating(true)
    const toastId = showLoading('Gerando conteúdo com IA...')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }
      
      const response = await fetch(CONTENT_GENERATOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'generate',
          keyword: keyword.trim(),
          context,
          audience,
          type: contentType
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        dismissToast(toastId)
        throw new Error(`Falha na requisição (Status ${response.status}): ${errorText.substring(0, 100)}...`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        dismissToast(toastId)
        showSuccess(`Conteúdo gerado! Revise na aba Rascunhos.`)
        setKeyword('')
        if (result.draftId) {
            onContentGenerated(result.draftId)
            onSetTab('editor')
        }
      } else {
        dismissToast(toastId)
        throw new Error(result.error || 'Erro desconhecido na Edge Function.')
      }
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error generating content:', error)
      showError(`Falha na geração: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center text-green-800">
          <Target className="w-6 h-6 mr-2" />
          Motor de Conteúdo Nível Profissional
        </CardTitle>
        <p className="text-sm text-green-700">Gere conteúdo otimizado para SEO local, Google Discover e o mercado moçambicano</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Palavra-chave Principal</label>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ex: vender eletrônicos online" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Público-Alvo</label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Conteúdo</label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Contexto Local</label>
            <Select value={context} onValueChange={setContext}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTEXT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={generateContent} 
          disabled={generating || !keyword.trim()}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {generating ? (
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando conteúdo...
            </div>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Gerar Artigo Hiper-Localizado
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ContentGenerationControls