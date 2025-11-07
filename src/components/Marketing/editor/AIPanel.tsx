import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Zap, X, Loader2, Send } from 'lucide-react'
import { ContentDraft, LocalDraftState } from '../../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../../utils/toast'
import { JSONContent } from '@tiptap/react'

interface AIPanelProps {
  isOpen: boolean
  onClose: () => void
  draft: LocalDraftState
  onContentGenerated: (content: JSONContent) => void
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, draft, onContentGenerated }) => {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Simulação de chamada de IA
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showError('Insira um prompt para gerar conteúdo.')
      return
    }
    
    setLoading(true)
    const toastId = showLoading('Gerando conteúdo com IA...')
    
    // Simulação de geração de conteúdo TipTap JSON
    const simulatedContent: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: `Seção Gerada por IA: ${prompt}` }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: `Este parágrafo foi gerado pela inteligência artificial para expandir o seu artigo. A IA focou em fornecer detalhes ricos e relevantes para o contexto de ${draft.context} e o público-alvo de ${draft.audience}.` }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ponto chave 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ponto chave 2' }] }] }
          ]
        }
      ]
    }
    
    setTimeout(() => {
      dismissToast(toastId)
      
      // O TipTap tem um comando para inserir conteúdo no final do documento.
      // Para simplificar a simulação, vamos apenas retornar o novo bloco.
      // O AdvancedEditor fará o merge ou substituição.
      onContentGenerated(simulatedContent) 
      
      showSuccess('Conteúdo gerado e adicionado ao editor!')
      setLoading(false)
      setPrompt('')
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="w-80 bg-white border-l flex flex-col flex-shrink-0 absolute right-0 top-0 bottom-0 z-20 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-purple-50">
        <CardTitle className="text-lg flex items-center text-purple-800">
          <Zap className="w-5 h-5 mr-2" />
          Assistente de IA
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">O que você gostaria de gerar?</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Escreva uma seção sobre 'Logística em Maputo'"
            rows={4}
            disabled={loading}
          />
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Gerar Conteúdo
        </Button>
        
        <div className="border-t pt-4 space-y-2">
          <h3 className="text-sm font-semibold">Contexto Atual</h3>
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

export default AIPanel