import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { 
  Save, Send, X, Loader2
} from 'lucide-react'
import { ContentDraft, BlogCategory } from '../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { useEditor, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'

// Subcomponentes
import TipTapToolbar from './editor/TipTapToolbar'
import EditorCanvas from './editor/EditorCanvas'
import Sidebar from './editor/Sidebar'
import Statusbar from './editor/Statusbar'
import AIPanel from './editor/AIPanel'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import OptimizedImageUpload from './OptimizedImageUpload'
import TipTapRenderer from '../TipTapRenderer' // Importando o Renderer

interface AdvancedEditorProps {
  draft: ContentDraft
  categories: BlogCategory[]
  onSave: (draft: ContentDraft) => Promise<void>
  onPublish: (draft: ContentDraft) => Promise<void>
  onCancel: () => void
}

// Função auxiliar para converter string JSON para JSONContent
const parseContent = (content: string | null): JSONContent | undefined => {
    if (!content) return undefined;
    try {
        return JSON.parse(content);
    } catch {
        return undefined;
    }
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ draft, categories, onSave, onPublish, onCancel }) => {
  // O estado local agora armazena o conteúdo como JSONContent
  const [localDraft, setLocalDraft] = useState<ContentDraft>({
    ...draft,
    content: draft.content ? JSON.parse(draft.content) : null // Parse inicial
  });
  
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [wordCount, setWordCount] = useState(0)

  // 1. Inicializa o TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount.configure({
        limit: 10000,
      }),
    ],
    content: localDraft.content || '', // Conteúdo inicial em JSON
    onUpdate: ({ editor }) => {
      // Atualiza o estado local com o novo JSON
      setLocalDraft(prev => ({ ...prev, content: editor.getJSON() as any }))
      // Atualiza a contagem de palavras
      setWordCount(editor.storage.characterCount.words())
    },
    editorProps: {
        attributes: {
            class: 'ProseMirror max-w-none min-h-[400px] focus:outline-none p-4',
        },
    },
  })
  
  // Sincroniza o rascunho externo (ex: ao selecionar um novo rascunho)
  useEffect(() => {
    const parsedContent = draft.content ? JSON.parse(draft.content) : null;
    setLocalDraft({ ...draft, content: parsedContent });
    
    if (editor && parsedContent) {
        // Usamos setContent com o JSON
        editor.commands.setContent(parsedContent, false);
    }
  }, [draft, editor])

  // Função para salvar o rascunho
  const handleSave = useCallback(async () => {
    setSaving(true)
    
    // Converte o JSONContent de volta para string JSON para salvar no banco
    const contentString = JSON.stringify(localDraft.content);
    const draftToSave = { ...localDraft, content: contentString } as ContentDraft;
    
    const toastId = showLoading('Salvando rascunho...')
    try {
      await onSave(draftToSave)
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
    
    // Converte o JSONContent de volta para string JSON para publicar
    const contentString = JSON.stringify(localDraft.content);
    const draftToPublish = { ...localDraft, content: contentString } as ContentDraft;
    
    const toastId = showLoading('Publicando artigo...')
    try {
      await onPublish(draftToPublish)
      showSuccess('Artigo publicado com sucesso!')
    } catch (error) {
      console.error('Error publishing draft:', error)
      showError('Erro ao publicar o artigo.')
    } finally {
      setPublishing(false)
      dismissToast(toastId)
    }
  }, [localDraft, onPublish])
  
  // Função para atualizar o conteúdo do editor com o novo JSON gerado pela IA
  const handleContentGenerated = useCallback((newContentJson: JSONContent) => {
    if (editor) {
        editor.commands.setContent(newContentJson)
    }
    setIsAIPanelOpen(false)
  }, [editor])
  
  const handleInputChange = (name: keyof ContentDraft, value: any) => {
    setLocalDraft(prev => ({ ...prev, [name]: value }))
  }
  
  const availableCategories = useMemo(() => {
    return categories.map(cat => ({ value: cat.id, label: cat.name }))
  }, [categories])

  if (!editor) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Barra de Ferramentas Superior */}
      <TipTapToolbar
        editor={editor}
        onSave={handleSave}
        onPublish={handlePublish}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onGenerateWithAI={() => setIsAIPanelOpen(true)}
        isPreviewMode={isPreviewMode}
        isSaving={saving}
        isPublishing={publishing}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Área Principal do Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas do Editor ou Pré-visualização */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg min-h-full space-y-6">
              
              {/* Metadados */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">Metadados e SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título (H1) *</Label>
                      <Input 
                        id="title"
                        value={localDraft.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Título principal do artigo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL) *</Label>
                      <Input 
                        id="slug"
                        value={localDraft.slug || ''}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="slug-do-artigo"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Descrição *</Label>
                    <Textarea 
                      id="meta_description"
                      value={localDraft.meta_description || ''}
                      onChange={(e) => handleInputChange('meta_description', e.target.value)}
                      placeholder="Descrição curta para SEO (máx 160 caracteres)"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {localDraft.meta_description?.length || 0} / 160
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Select 
                        value={localDraft.category_id || ''} 
                        onValueChange={(value) => handleInputChange('category_id', value)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Palavras-chave Secundárias (Separadas por vírgula)</Label>
                      <Input 
                        id="keywords"
                        value={(localDraft.secondary_keywords || []).join(', ')}
                        onChange={(e) => handleInputChange('secondary_keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0))}
                        placeholder="ex: frete grátis, e-commerce moçambique"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Imagem de Destaque */}
              <OptimizedImageUpload
                value={localDraft.featured_image_url || ''}
                altText={localDraft.image_alt_text || ''}
                imagePrompt={localDraft.image_prompt || ''}
                onImageChange={(url) => handleInputChange('featured_image_url', url)}
                onAltTextChange={(alt) => handleInputChange('image_alt_text', alt)}
                onPromptChange={(prompt) => handleInputChange('image_prompt', prompt)}
              />

              {/* Editor de Conteúdo */}
              <h2 className="text-xl font-bold text-gray-900 pt-4">Conteúdo do Artigo</h2>
              {isPreviewMode ? (
                <Card className="p-4 border rounded-lg bg-gray-50">
                  {/* Pré-visualização usando o TipTapRenderer */}
                  {localDraft.content ? (
                    <TipTapRenderer content={localDraft.content as JSONContent} />
                  ) : (
                    <p className="text-gray-500">Nenhum conteúdo para pré-visualizar.</p>
                  )}
                </Card>
              ) : (
                <EditorCanvas
                  editor={editor} // Passa a instância do editor
                  initialContent={localDraft.content || ''}
                  onChange={handleContentChange}
                />
              )}
            </div>
          </div>

          {/* Barra de Status Inferior */}
          <Statusbar
            draft={localDraft}
            onSave={handleSave}
            onPublish={handlePublish}
            wordCount={wordCount}
          />
        </div>
        
        {/* Barra Lateral (TOC, Sugestões, etc.) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          draft={localDraft}
          categories={categories}
          onGenerateWithAI={() => setIsAIPanelOpen(true)}
          wordCount={wordCount}
        />
      </div>

      {/* Painel Lateral de IA (se aberto) */}
      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        draft={localDraft}
        onContentGenerated={handleContentGenerated}
      />
    </div>
  )
}

export default AdvancedEditor