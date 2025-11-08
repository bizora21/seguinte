import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Zap, Target, Users, FileText, Globe, Loader2 } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import KeywordSuggester from './KeywordSuggester'

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

const CONTEXT_OPTIONS = [
  { value: 'maputo', label: 'Maputo e Região' },
  { value: 'beira', label: 'Beira e Sofala' },
  { value: 'nampula', label: 'Nampula e Norte' },
  { value: 'nacional', label: 'Nacional (Todo MZ)' },
]

const CONTENT_GENERATOR_BASE_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator'

interface ContentGenerationControlsProps {
  onContentGenerated: (draftId: string) => void
  onSetTab: (tab: string) => void
}

const ContentGenerationControls: React.FC<ContentGenerationControlsProps> = ({ onContentGenerated }) => {
  const [keyword, setKeyword] = useState('')
  const [context, setContext] = useState('maputo')
  const [audience, setAudience] = useState('vendedores')
  const [contentType, setContentType] = useState('guia-completo')
  const [generating, setGenerating] = useState(false)

  const generateContent = async () => {
    if (!keyword.trim()) {
      showError('A palavra-chave principal é obrigatória.')
      return
    }

    setGenerating(true)
    const toastId = showLoading('Gerando conteúdo com IA...')
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        dismissToast(toastId)
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }
      
      const response = await fetch(CONTENT_GENERATOR_BASE_URL, {
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
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Falha na requisição (Status ${response.status})`);
        } catch {
            throw new Error(`Falha na requisição (Status ${response.status}): ${errorText.substring(0, 100)}...`);
        }
      }
      
      const result = await response.json()
      
      if (result.success) {
        dismissToast(toastId)
        showSuccess(`Conteúdo gerado! Revise no editor.`)
        setKeyword('')
        if (result.draftId) {
            onContentGenerated(result.draftId)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Target className="w-6 h-6 mr-2 text-primary" />
          Motor de Conteúdo Profissional
        </CardTitle>
        <p className="text-sm text-gray-600">Gere artigos otimizados para SEO local, Google Discover e o mercado moçambicano.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tópico Principal ou Palavra-chave *</label>
          <KeywordSuggester 
            value={keyword} 
            onChange={setKeyword}
            onSuggestionSelect={(suggestion) => setKeyword(suggestion.keyword)}
          />
        </div>
        
        <div>
          <h3 className="text-base font-medium text-gray-700 mb-2">Refinamentos (Opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center"><Users className="w-4 h-4 mr-1" /> Público-Alvo</label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center"><FileText className="w-4 h-4 mr-1" /> Tipo de Conteúdo</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center"><Globe className="w-4 h-4 mr-1" /> Contexto Local</label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTEXT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={generateContent} 
          disabled={generating || !keyword.trim()} 
          className="w-full bg-primary hover:bg-green-700 text-white" 
          size="lg"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando Artigo...</>
          ) : (
            <><Zap className="w-5 h-5 mr-2" /> Gerar Artigo com IA</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ContentGenerationControls