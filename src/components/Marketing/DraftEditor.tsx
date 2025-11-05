import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Edit, Save, X, BarChart3, Globe, Eye, AlertTriangle, Loader2, RefreshCw, MessageSquare } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import TipTapEditor from './TipTapEditor'
import OptimizedImageUpload from './OptimizedImageUpload'
import { BlogCategory, ContentDraft } from '../../types/blog'
import { CONTENT_GENERATOR_BASE_URL } from '../../utils/admin'

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
  const [reanalyzing, setReanalyzing] = useState(false)
  const [seoSuggestions, setSeoSuggestions] = useState<string[]>([])

  useEffect(() => {
    setLocalDraft(draft)
    // Limpar sugestões ao carregar novo rascunho
    setSeoSuggestions([])
  }, [draft])

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
  
  const handleReanalyzeSEO = async () => {
    if (!localDraft.content || !localDraft.keyword) {
      showError('O rascunho deve ter conteúdo e palavra-chave para reanálise.')
      return
    }
    
    setReanalyzing(true)
    const toastId = showLoading('Reanalisando SEO e legibilidade...')
    
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
          draft: localDraft
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
      
      if (result.success && result.data) {
        const { seo_score, readability_score, suggestions } = result.data
        
        setLocalDraft(prev => ({
          ...prev,
          seo_score: seo_score || prev.seo_score,
          readability_score: readability_score || prev.readability_score,
        }))
        setSeoSuggestions(suggestions || [])
        
        dismissToast(toastId)
        showSuccess('Análise de SEO concluída! Verifique as sugestões.')
      } else {
        dismissToast(toastId)
        throw new Error(result.error || 'Erro desconhecido na Edge Function de reanálise.')
      }
      
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error reanalyzing SEO:', error)
      showError(`Falha na reanálise: ${error.message}`)
    } finally {
      setReanalyzing(false)
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Metadados */}
          <div className="space-y-4 lg:col-span-1">
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
            
            {/* Sugestões de SEO */}
            <Card className="mt-4 bg-blue-50 border-blue-200">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center text-blue-800">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Sugestões de Otimização
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    {seoSuggestions.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                            {seoSuggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-blue-700">
                            Clique em "Reanálise de SEO" para obter sugestões.
                        </p>
                    )}
                    <Button 
                        onClick={handleReanalyzeSEO} 
                        disabled={reanalyzing}
                        variant="outline"
                        className="w-full mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                        size="sm"
                    >
                        {reanalyzing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Reanálise de SEO
                    </Button>
                </CardContent>
            </Card>
          </div>
          
          {/* Coluna 2: Imagem de Destaque */}
          <div className="space-y-4 lg:col-span-2">
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
          <Label>Conteúdo do Artigo (Palavras: {wordCount})</Label>
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
          <Button onClick={handlePublishClick} disabled={publishing || wordCount < 1200} className="flex-1 bg-green-600 hover:bg-green-700">
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