import React, { useMemo } from 'react'
import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'
import { Separator } from '../../ui/separator'
import { Clock, Save, Send, CheckCircle, AlertTriangle, FileText } from 'lucide-react'
import { ContentDraft } from '../../../types/blog'

interface StatusbarProps {
  draft: ContentDraft
  onSave: () => void
  onPublish: () => void
  wordCount: number
}

const Statusbar: React.FC<StatusbarProps> = ({ draft, onSave, onPublish, wordCount }) => {
  
  const status = useMemo(() => {
    // Simulação de status de salvamento
    return 'Salvo recentemente'
  }, [])

  return (
    <div className="border-t bg-gray-100 px-4 py-2 flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1 text-blue-600" />
          <span>Status: {status}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center">
          <FileText className="w-4 h-4 mr-1 text-green-600" />
          <span>Palavras: {wordCount}</span>
        </div>
        <div className="flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1 text-yellow-600" />
          <span>SEO Score: {draft.seo_score || 0}%</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button onClick={onSave} size="sm" variant="outline">
          <Save className="w-4 h-4 mr-1" /> Salvar
        </Button>
        <Button onClick={onPublish} size="sm" className="bg-green-600 hover:bg-green-700">
          <Send className="w-4 h-4 mr-1" /> Publicar
        </Button>
      </div>
    </div>
  )
}

export default Statusbar