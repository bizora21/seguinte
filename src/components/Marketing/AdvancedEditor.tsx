import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { 
  Save, Send, X, Loader2, ArrowLeft
} from 'lucide-react'
import { ContentDraft, BlogCategory, LocalDraftState } from '../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { useEditor, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import { supabase } from '../../lib/supabase'

// Subcomponentes
import TipTapToolbar from './editor/TipTapToolbar'
import EditorCanvas from './editor/EditorCanvas'
import Sidebar from './editor/Sidebar'
import Statusbar from './editor/Statusbar'
import SEOSuggestionsPanel from './editor/SEOSuggestionsPanel'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import OptimizedImageUpload from './OptimizedImageUpload'
import TipTapRenderer from '../TipTapRenderer'

// Configurações de extensão para o TipTap
const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
    blockquote: {},
    bulletList: {},
    orderedList: {},
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
    limit: 100000, // Limite alto
  }),
];

interface AdvancedEditorProps {
  initialDraft: ContentDraft | null
  categories: BlogCategory[]
  onCloseEditor: () => void
  onDraftUpdated: () => void
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ initialDraft, categories, onCloseEditor, onDraftUpdated }) => {
  const [draft, setDraft] = useState<LocalDraftState | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAISuggestionsOpen, setIsAISuggestionsOpen] = useState(false)

  // Inicializa o estado local do rascunho
  useEffect(() => {
    if (initialDraft) {
      let contentJson: JSONContent | null = null
      try {
        contentJson = initialDraft.content ? JSON.parse(initialDraft.content) : null
      } catch {}
      
      setDraft({
        ...initialDraft,
        content: contentJson,
        seo_score: initialDraft.seo_score || 0,
        readability_score: initialDraft.readability_score || 'N/A',
        secondary_keywords: initialDraft.secondary_keywords || [],
        external_links: initialDraft.external_links || [],
        internal_links: initialDraft.internal_links || [],
      })
    }
  }, [initialDraft])

  // Inicializa o TipTap Editor
  const editor = useEditor({
    extensions: editorExtensions,
    content: draft?.content || { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Comece a escrever aqui...' }] }] },
    onUpdate: ({ editor }) => {
      if (draft) {
        setDraft(prev => prev ? { ...prev, content: editor.getJSON() } : null)
      }
    },
    onTransaction: ({ editor }) => {
      const words = editor.storage.characterCount.words();
      setWordCount(words);
    },
    editorProps: {
        attributes: {
            class: 'max-w-none min-h-[400px] focus:outline-none p-4',
        },
    },
  }, [draft?.id]) // Recria o editor quando o rascunho muda

  // Sincroniza o conteúdo do editor quando o draft.content muda (ex: após geração da IA)
  useEffect(() => {
    if (editor && draft?.content && JSON.stringify(editor.getJSON()) !== JSON.stringify(draft.content)) {
        editor.commands.setContent(draft.content);
    }
  }, [editor, draft?.content]);

  // --- Handlers de Salvamento e Publicação ---

  const handleSave = useCallback(async () => {
    if (!draft || !draft.id || !editor) return

    setIsSaving(true)
    const toastId = showLoading('Salvando rascunho...')

    try {
      const contentString = JSON.stringify(editor.getJSON())
      
      const { error } = await supabase
        .from('content_drafts')
        .update({
          title: draft.title,
          slug: draft.slug,
          meta_description: draft.meta_description,
          content: contentString,
          featured_image_url: draft.featured_image_url,
          image_alt_text: draft.image_alt_text,
          secondary_keywords: draft.secondary_keywords,
          category_id: draft.category_id,
          image_prompt: draft.image_prompt,
          seo_score: draft.seo_score,
          readability_score: draft.readability_score,
          context: draft.context,
          audience: draft.audience,
          external_links: draft.external_links,
          internal_links: draft.internal_links,
        })
        .eq('id', draft.id)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Rascunho salvo com sucesso!')
      onDraftUpdated() // Notifica o pai para recarregar a lista
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao salvar rascunho: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }, [draft, editor, onDraftUpdated])

  const handlePublish = useCallback(async () => {
    if (!draft || !draft.id || !editor) return
    if (!draft.title || !draft.slug || !draft.meta_description || !draft.category_id || !draft.featured_image_url) {
      showError('Preencha Título, Slug, Meta Descrição, Categoria e Imagem de Destaque antes de publicar.')
      return
    }

    setIsPublishing(true)
    const toastId = showLoading('Publicando artigo...')

    try {
      // 1. Salvar o rascunho final
      await handleSave()

      // 2. Mover o conteúdo para a tabela published_articles
      const contentString = JSON.stringify(editor.getJSON())
      
      const publishedData = {
        title: draft.title,
        slug: draft.slug,
        meta_description: draft.meta_description,
        content: contentString,
        status: 'published',
        featured_image_url: draft.featured_image_url,
        image_alt_text: draft.image_alt_text,
        external_links: draft.external_links,
        internal_links: draft.internal_links,
        secondary_keywords: draft.secondary_keywords,
        seo_score: draft.seo_score,
        readability_score: draft.readability_score,
        category_id: draft.category_id,
        image_prompt: draft.image_prompt,
        context: draft.context,
        audience: draft.audience,
        published_at: new Date().toISOString(),
      }

      // Tenta inserir na tabela de publicados
      const { error: insertError } = await supabase
        .from('published_articles')
        .insert(publishedData)

      if (insertError) {
        // Se falhar, pode ser por slug duplicado.
        throw new Error('Falha ao inserir artigo publicado: ' + insertError.message)
      }
      
      // 3. Atualizar o status do rascunho para 'published'
      const { error: updateDraftError } = await supabase
        .from('content_drafts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', draft.id)
        
      if (updateDraftError) {
        // Isso é menos crítico, mas deve ser registrado
        console.error('Erro ao marcar rascunho como publicado:', updateDraftError)
      }

      dismissToast(toastId)
      showSuccess('Artigo publicado com sucesso! Ele está agora visível no blog.')
      onCloseEditor() // Fecha o editor e volta para a lista
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao publicar artigo: ' + error.message)
    } finally {
      setIsPublishing(false)
    }
  }, [draft, editor, handleSave, onCloseEditor])
  
  const handleUpdateMetrics = useCallback((seoScore: number, readabilityScore: string) => {
    setDraft(prev => prev ? { ...prev, seo_score: seoScore, readability_score: readabilityScore } : null)
  }, [])

  if (!draft || !editor) {
    return (
      <div className="flex justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  const currentCategory = categories.find(c => c.id === draft.category_id)

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <TipTapToolbar 
        editor={editor}
        onSave={handleSave}
        onPublish={handlePublish}
        onTogglePreview={() => setIsPreviewMode(prev => !prev)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onGenerateWithAI={() => setIsAISuggestionsOpen(true)}
        isPreviewMode={isPreviewMode}
        isSaving={isSaving}
        isPublishing={isPublishing}
      />

      {/* Editor / Preview e Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Principal / Preview */}
        <div className={`flex-1 overflow-y-auto ${isSidebarOpen ? 'max-w-[calc(100%-320px)]' : 'max-w-full'}`}>
          <div className="p-6">
            {/* Metadados */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Metadados e SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título (H1) *</Label>
                    <Input
                      id="title"
                      value={draft.title || ''}
                      onChange={(e) => setDraft(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Título principal do artigo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={draft.slug || ''}
                      onChange={(e) => setDraft(prev => prev ? { ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } : null)}
                      placeholder="slug-do-artigo"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Descrição * (Max 160 chars)</Label>
                  <Textarea
                    id="meta_description"
                    value={draft.meta_description || ''}
                    onChange={(e) => setDraft(prev => prev ? { ...prev, meta_description: e.target.value.substring(0, 160) } : null)}
                    placeholder="Descrição curta para SEO"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {draft.meta_description?.length || 0} / 160
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select 
                      value={draft.category_id || ''} 
                      onValueChange={(value) => setDraft(prev => prev ? { ...prev, category_id: value } : null)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Palavras-chave Secundárias</Label>
                    <Input
                      id="keywords"
                      value={(draft.secondary_keywords || []).join(', ')}
                      onChange={(e) => setDraft(prev => prev ? { ...prev, secondary_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0) } : null)}
                      placeholder="separar por vírgula"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Imagem de Destaque */}
            <OptimizedImageUpload
              value={draft.featured_image_url || ''}
              altText={draft.image_alt_text || ''}
              imagePrompt={draft.image_prompt || ''}
              onImageChange={(url) => setDraft(prev => prev ? { ...prev, featured_image_url: url } : null)}
              onAltTextChange={(alt) => setDraft(prev => prev ? { ...prev, image_alt_text: alt } : null)}
              onPromptChange={(prompt) => setDraft(prev => prev ? { ...prev, image_prompt: prompt } : null)}
            />

            {/* Editor de Conteúdo */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">Conteúdo do Artigo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isPreviewMode ? (
                  <div className="p-6 bg-gray-50 min-h-[400px]">
                    <TipTapRenderer content={editor.getJSON()} />
                  </div>
                ) : (
                  <EditorCanvas editor={editor} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar de Ferramentas */}
        {isSidebarOpen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            draft={draft}
            categories={categories}
            onGenerateWithAI={() => setIsAISuggestionsOpen(true)}
            wordCount={wordCount}
          />
        )}
      </div>

      {/* Statusbar */}
      <Statusbar 
        draft={draft}
        onSave={handleSave}
        onPublish={handlePublish}
        wordCount={wordCount}
      />
      
      {/* Painel de Sugestões de IA (Modal) */}
      <SEOSuggestionsPanel
        isOpen={isAISuggestionsOpen}
        onClose={() => setIsAISuggestionsOpen(false)}
        draft={draft}
        wordCount={wordCount}
        onUpdateMetrics={handleUpdateMetrics}
      />
    </div>
  )
}

export default AdvancedEditor