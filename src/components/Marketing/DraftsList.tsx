import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Edit, Send, Zap, Globe, FileText, BarChart3, Trash2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'
import { ContentDraft } from '../../types/blog'

interface DraftsListProps {
  drafts: ContentDraft[]
  loading: boolean
  onEdit: (draft: ContentDraft) => void
  onPublish: (draft: ContentDraft) => void
  onDelete: (draftId: string) => void
}

const DraftsList: React.FC<DraftsListProps> = ({ drafts, loading, onEdit, onPublish, onDelete }) => {
  
  const getSeoColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  if (loading) {
    return (
      <div className="flex justify-center h-32">
        <LoadingSpinner />
      </div>
    )
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum rascunho</h2>
          <p className="text-gray-600">Gere seu primeiro artigo com IA</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <Card key={draft.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{draft.title}</h3>
                <p className="text-sm text-gray-600">Palavra-chave: {draft.keyword}</p>
              </div>
              <div className="flex space-x-2">
                <Badge variant="secondary" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {draft.audience}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {draft.context}
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  SEO Score: <span className={`font-bold ${getSeoColor(draft.seo_score)}`}>{draft.seo_score}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Criado em {formatDate(draft.created_at)}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={() => onEdit(draft)} size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-1" /> Revisar
                </Button>
                <Button onClick={() => onPublish(draft)} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-1" /> Publicar
                </Button>
                <Button onClick={() => onDelete(draft.id)} size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default DraftsList