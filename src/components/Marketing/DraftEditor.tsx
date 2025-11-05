import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Edit, Save, X, BarChart3, Globe, Eye, AlertTriangle, Loader2 } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import TipTapEditor from './TipTapEditor'
import OptimizedImageUpload from './OptimizedImageUpload'
import { BlogCategory, ContentDraft } from '../../types/blog'

interface DraftEditorProps {
  draft: ContentDraft
  categories: BlogCategory[]
  onSave: (draft: ContentDraft) => void
  onPublish: (draft: ContentDraft) => void
  onCancel: () => void
}

const DraftEditor: React.FC<DraftEditorProps> = ({ draft, categories, onSave, onPublish, onCancel }) => {
  const { user } = useAuth()
  const [localDraft, setLocalDraft] = useState<ContentDraft>(draft)
  const [wordCount, setWordCount] = useState(0)
  const [publishing, setPublishing] = useState(false)

  const handleDraftUpdate = (field: keyof ContentDraft, value: any) => {
    setLocalDraft(prev => ({ ...prev, [field]: value }))
  }

  const handlePublishClick = async () => {
    if (!localDraft.featured_image_url) {
      showError('Adicione uma imagem de destaque antes de publicar.')
      return
    }
    if (!localDraft.category_id) {
      showError('Selecione uma categoria antes de publicar.')
      return
    }
    if (!localDraft.slug || localDraft.slug.trim() === '') {
      showError('O slug (URL) do artigo é obrigatório.')
      return
    }
    if (wordCount < 1200) {
      showError(`O artigo precisa ter no mínimo 1200 palavras. Atualmente: ${wordCount} palavras.`)
      return
    }
    setPublishing(true)
    await onPublish(localDraft)
    setPublishing(false)
  }

  const getSeoColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <Edit className="w-6 h-6 mr-2" />
          Editor Avançado: {localDraft.title}
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm">
          <Badge className={`bg-yellow-100 text-yellow-800 ${wordCount < 1200 ? 'border-red-500 border' : ''}`}>
            <BarChart3 className="w-3 h-3 mr-1" /> SEO Score: <span className={`font-bold ${getSeoColor(localDraft.seo_score)}`}>{localDraft.seo_score}%</span>
          </Badge>
          <Badge className={`bg-blue-100 text-blue-800 ${wordCount < 1200 ? 'border-red-500 border' : ''}`}>
            <Globe className="w-3 h-3 mr-1" /> Contexto: {localDraft.context}
          </Badge>
          <Badge className={`bg-purple-100 text-purple-800 ${wordCount < 1200 ? 'border-red-500 border' : ''}`}>
            <Eye className="w-3 h-3 mr-1" /> Público: {localDraft.audience}
          </Badge>
        </div>
        {wordCount < 1200 && (
          <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            O artigo precisa ter no mínimo 1200 palavras. Atualmente: {wordCount} palavras.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Artigo</Label>
              <Input
                id="title"
                value={localDraft.title}
                onChange={(e) => handleDraftUpdate('title', e.target.value)}
                placeholder="Título principal do artigo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={localDraft.slug || ''}
                onChange={(e) => handleDraftUpdate('slug', e.target.value)}
                placeholder="url-do-artigo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Descrição</Label>
              <Input
                id="meta_description"
                value={localDraft.meta_description || ''}
                onChange={(e) => handleDraftUpdate('meta_description', e.target.value)}
                placeholder="Descrição para SEO (até 160 caracteres)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={localDraft.category_id || ''} onValueChange={(value) => handleDraftUpdate('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <OptimizedImageUpload
              value={localDraft.featured_image_url || ''}
              altText={localDraft.image_alt_text || ''}
              imagePrompt={localDraft.image_prompt || ''}
              onImageChange={(url) => handleDraftUpdate('featured_image_url', url)}
              onAltTextChange={(alt) => handleDraftUpdate('image_alt_text', alt)}
              onPromptChange={(prompt) => handleDraftUpdate('image_prompt', prompt)}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Conteúdo do Artigo</Label>
          <TipTapEditor
            initialContent={localDraft.content ? JSON.parse(localDraft.content) : null}
            onChange={(content) => handleDraftUpdate('content', JSON.stringify(content))}
            wordCount={wordCount}
            onWordCountChange={setWordCount}
          />
        </div>
        
        <div className="flex space-x-4">
          <Button onClick={() => onSave(localDraft)} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button onClick={handlePublishClick} disabled={publishing} className="flex-1 bg-green-600 hover:bg-green-700">
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Publicar Agora
              </>
            )}
          </Button>
          <Button onClick={onCancel} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DraftEditor