import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, 
  Link, Image, Table, Quote, Code,
  Undo, Redo, 
  Eye, Edit3, Save, Send, X, Plus, Trash2,
  FileText, Lightbulb, BarChart3, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react'
import { ContentDraft, BlogCategory } from '../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { CONTENT_GENERATOR_BASE_URL } from '../../utils/admin'

// Subcomponentes
import Toolbar from './editor/Toolbar'
import EditorCanvas from './editor/EditorCanvas'
import Sidebar from './editor/Sidebar'
import Statusbar from './editor/Statusbar'
import AIPanel from './editor/AIPanel'

interface AdvancedEditorProps {
  draft: ContentDraft
  categories: BlogCategory[]
  onSave: (draft: ContentDraft) => Promise<void>
  onPublish: (draft: ContentDraft) => Promise<void>
  onCancel: () => void
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ draft, categories, onSave, onPublish, onCancel }) => {
  const [localDraft, setLocalDraft] = useState(draft)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [history, setHistory] = useState<{ content: string; timestamp: number }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Sincroniza o estado local quando o rascunho externo mudar
  useEffect(() => {
    setLocalDraft(draft)
    // Inicializa o histórico com o conteúdo atual
    setHistory([{ content: draft.content || '', timestamp: Date.now() }])
    setHistoryIndex(0)
  }, [draft])

  // Função para salvar o rascunho
  const handleSave = useCallback(async () => {
    setSaving(true)
    const toastId = showLoading('Salvando rascunho...')
    try {
      await onSave(localDraft)
      showSuccess('Rascunho salvo com sucesso!')
    } catch (error) {
      console.error('Error saving draft:', error)
      showError('Erro ao salvar o rascunho.')
    } finally {
      setSaving(false)
      dismissToast(toastId)
    }
  }, [localDraft, onSave])

  // Função para publicar o rascunho
  const handlePublish = useCallback(async () => {
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
    setPublishing(true)
    const toastId = showLoading('Publicando artigo...')
    try {
      await onPublish(localDraft)
      showSuccess('Artigo publicado com sucesso!')
    } catch (error) {
      console.error('Error publishing draft:', error)
      showError('Erro ao publicar o artigo.')
    } finally {
      setPublishing(false)
      dismissToast(toastId)
    }
  }, [localDraft, onPublish])

  // Função para desfazer a última ação
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setLocalDraft(prev => ({ ...prev, content: history[historyIndex - 1].content }))
    }
  }, [history, historyIndex])

  // Função para refazer a última ação
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setLocalDraft(prev => ({ ...prev, content: history[historyIndex + 1].content }))
    }
  }, [history, historyIndex])

  // Função para atualizar o conteúdo
  const handleContentChange = useCallback((newContent: string) => {
    setLocalDraft(prev => ({ ...prev, content: newContent }))
    
    // Adiciona ao histórico (limita a 50 estados)
    const newHistory = [...history.slice(0, historyIndex + 1), { content: newContent, timestamp: Date.now() }]
    setHistory(newHistory.slice(-50))
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  // Função para gerar conteúdo com IA
  const handleGenerateWithAI = useCallback((prompt: string) => {
    setIsAIPanelOpen(true)
    // O prompt pode ser usado para pré-preencher o campo no AIPanel
  }, [])

  // Renderiza o editor
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Barra de Ferramentas Superior */}
      <Toolbar
        onSave={handleSave}
        onPublish={handlePublish}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onGenerateWithAI={() => setIsAIPanelOpen(true)}
        isPreviewMode={isPreviewMode}
        isSaving={saving}
        isPublishing={publishing}
        draft={localDraft}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Área Principal do Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas do Editor ou Pré-visualização */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg min-h-full">
              {isPreviewMode ? (
                <div className="prose prose-lg max-w-none">
                  {/* Renderizador de Pré-visualização (usando dangerouslySetInnerHTML para HTML do TipTap) */}
                  <div dangerouslySetInnerHTML={{ __html: localDraft.content || '<h1>Nenhum Conteúdo para Pré-visualizar</h1>' }} />
                </div>
              ) : (
                <EditorCanvas
                  initialContent={localDraft.content || ''}
                  onChange={handleContentChange}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  history={history}
                  historyIndex={historyIndex}
                />
              )}
            </div>
          </div>

          {/* Barra de Status Inferior */}
          <Statusbar
            draft={localDraft}
            onSave={handleSave}
            onPublish={handlePublish}
          />
        </div>
        
        {/* Barra Lateral (TOC, Sugestões, etc.) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          draft={localDraft}
          categories={categories}
          onGenerateWithAI={handleGenerateWithAI}
        />
      </div>

      {/* Painel Lateral de IA (se aberto) */}
      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        draft={localDraft}
        onContentGenerated={(newContent) => {
          // Atualiza o rascunho e adiciona ao histórico
          handleContentChange(newContent)
          setIsAIPanelOpen(false)
        }}
      />
    </div>
  )
}

export default AdvancedEditor