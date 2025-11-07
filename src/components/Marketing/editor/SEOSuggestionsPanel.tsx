import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Zap, X, Loader2, Send, RefreshCw, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react'
import { LocalDraftState } from '../../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../../utils/toast'
import { JSONContent } from '@tiptap/react'
import { CONTENT_GENERATOR_BASE_URL } from '../../../utils/admin'
import { supabase } from '../../../lib/supabase'
import { Badge } from '../../ui/badge'

interface SEOSuggestionsPanelProps {
  isOpen: boolean
  onClose: () => void
  draft: LocalDraftState
  wordCount: number
  onUpdateMetrics: (seoScore: number, readabilityScore: string) => void
}

interface ReanalyzeResult {
    seo_score: number
    readability_score: string
    suggestions: string[]
}

const SEOSuggestionsPanel: React.FC<SEOSuggestionsPanelProps> = ({ isOpen, onClose, draft, wordCount, onUpdateMetrics }) => {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(draft.seo_score < 90 ? ['Clique em Reanalisar para obter sugestões de melhoria.'] : [])
  
  const getSeoColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  const handleReanalyze = async () => {
    if (!draft.content || !draft.keyword) {
      showError('O rascunho deve ter conteúdo e palavra-chave principal definidos.')
      return
    }
    
    setLoading(true)
    const toastId = showLoading('Reanalisando SEO e Legibilidade...')
    
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
          action: 'reanalyze',
          draft: draft,
          wordCount: wordCount
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        dismissToast(toastId)
        throw new Error(`Falha na requisição (Status ${response.status}): ${errorText.substring(0, 100)}...`);
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const reanalyzeResult = result.data as ReanalyzeResult
        
        // 1. Atualizar métricas no AdvancedEditor
        onUpdateMetrics(reanalyzeResult.seo_score, reanalyzeResult.readability_score)
        
        // 2. Atualizar sugestões
        setSuggestions(reanalyzeResult.suggestions)
        
        dismissToast(toastId)
        showSuccess('Análise de SEO concluída! Verifique as sugestões.')
      } else {
        dismissToast(toastId)
        throw new Error(result.error || 'Erro desconhecido na Edge Function.')
      }
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error reanalyzing content:', error)
      showError(`Falha na reanálise: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="w-80 bg-white border-l flex flex-col flex-shrink-0 absolute right-0 top-0 bottom-0 z-20 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-purple-50">
        <CardTitle className="text-lg flex items-center text-purple-800">
          <Zap className="w-5 h-5 mr-2" />
          Assistente de SEO
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Métricas Atuais */}
        <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SEO Score:</span>
                    <span className={`text-xl font-bold ${getSeoColor(draft.seo_score)}`}>
                        {draft.seo_score}%
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium">Legibilidade:</span>
                    <span>{draft.readability_score || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium">Palavras:</span>
                    <span>{wordCount}</span>
                </div>
            </CardContent>
        </Card>

        <Button 
          onClick={handleReanalyze} 
          disabled={loading || !draft.content}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Reanalisar Conteúdo
        </Button>
        
        {/* Sugestões */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
            Sugestões de Melhoria
          </h3>
          
          {suggestions.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm">{suggestion}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma sugestão após a última análise.</p>
          )}
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <h3 className="text-sm font-semibold">Contexto de Geração</h3>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Palavra-chave:</span> {draft.keyword || 'N/A'}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Público:</span> {draft.audience}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Contexto Local:</span> {draft.context}
          </p>
        </div>
      </CardContent>
    </div>
  )
}

export default SEOSuggestionsPanel