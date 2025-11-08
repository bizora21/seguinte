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
    // Desabilitar extensões que serão adicionadas separadamente para evitar duplicatas
    // Esta é a sintaxe correta para desabilitar módulos internos do StarterKit
    link: false, 
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

  useEffect(() => {
    if (initialDraft) {
      setDraft({
        ...initialDraft,
        seo_score: initialDraft.seo_score || 0,
        readability_score: initialDraft.readability_score || 'N/A',
        secondary_keywords: initialDraft.secondary_keywords || [],
        external_links: initialDraft.external_links || [],
        internal_links: initialDraft.internal_links || [],
      })
    }
  }, [initialDraft])

  const editor = useEditor({
    extensions: editorExtensions,
    content: draft?.content || '', // Passando HTML diretamente
    onUpdate: ({ editor }) => {
      if (draft) {
        setDraft(prev => prev ? { ...prev, content: editor.getHTML() } : null)
      }
    },
    onTransaction: ({ editor }) => {
      const words = editor.storage.characterCount.words();
      setWordCount(words);
    },
    editorProps: {
        attributes: {
            class: 'prose max-w-none min-h-[calc(100vh-220px)] focus:outline-none p-4',
        },
    },
  }, [draft?.id])

  useEffect(() => {
    if (editor && draft?.content && editor.getHTML() !== draft.content) {
        editor.commands.setContent(draft.content);
    }
  }, [editor, draft?.content]);

  const handleSave = useCallback(async () => {
    if (!draft || !draft.id || !editor) return

    setIsSaving(true)
    const toastId = showLoading('Salvando rascunho...')

    try {
      const contentHtml = editor.getHTML()
      
      const { error } = await supabase
        .from('content_drafts')
        .update({
          title: draft.title,
          slug: draft.slug,
          meta_description: draft.meta_description,
          content: contentHtml, // Salvando HTML
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
      onDraftUpdated()
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
      await handleSave()
      const contentHtml = editor.getHTML()
      
      const publishedData = {
        title: draft.title,
        slug: draft.slug,
        meta_description: draft.meta_description,
        content: contentHtml, // Salvando HTML
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

      const { error: insertError } = await supabase
        .from('published_articles')
        .insert(publishedData)

      if (insertError) {
        throw new Error('Falha ao inserir artigo publicado: ' + insertError.message)
      }
      
      const { error: updateDraftError } = await supabase
        .from('content_drafts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', draft.id)
        
      if (updateDraftError) {
        console.error('Erro ao marcar rascunho como publicado:', updateDraftError)
      }

      dismissToast(toastId)
      showSuccess('Artigo publicado com sucesso!')
      onCloseEditor()
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

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] bg-white border rounded-lg overflow-hidden">
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-white">
          {isPreviewMode ? (
            <div className="p-6">
              <TipTapRenderer content={editor.getHTML()} />
            </div>
          ) : (
            <EditorCanvas editor={editor} />
          )}
        </div>

        {isSidebarOpen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            draft={draft}
            categories={categories}
            onUpdateDraft={setDraft}
            onGenerateWithAI={() => setIsAISuggestionsOpen(true)}
            wordCount={wordCount}
          />
        )}
      </div>

      <Statusbar 
        draft={draft}
        onSave={handleSave}
        onPublish={handlePublish}
        wordCount={wordCount}
      />
      
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