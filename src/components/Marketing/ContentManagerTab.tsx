import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2, Edit, Send, Trash2, Eye, Zap, Target } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { ContentDraft, BlogCategory } from '../../types/blog'
import AdvancedEditor from './AdvancedEditor'
import ContentGenerationControls from './ContentGenerationControls'
import DraftsList from './DraftsList'
import PublishedList from './PublishedList'
import BlogCategoryManager from './BlogCategoryManager' // Importação do BlogCategoryManager

const ContentManagerTab = () => {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  const [published, setPublished] = useState<ContentDraft[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('drafts')
  const [currentDraft, setCurrentDraft] = useState<ContentDraft | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchContent = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Buscar Categorias
      const { data: catData, error: catError } = await supabase
        .from('blog_categories')
        .select('*')
      
      if (catError) throw catError
      setCategories(catData || [])

      // 2. Buscar Rascunhos (status: draft)
      const { data: draftsData, error: draftsError } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        
      if (draftsError) throw draftsError
      setDrafts(draftsData || [])
      
      // 3. Buscar Publicados (status: published)
      const { data: publishedData, error: publishedError } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        
      if (publishedError) throw publishedError
      setPublished(publishedData || [])

    } catch (error) {
      console.error('Error loading content:', error)
      showError('Erro ao carregar conteúdo.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchContent()
    
    // Setup Realtime Subscription
    const channel = supabase
      .channel('content_drafts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'content_drafts' },
        (payload) => {
          console.log('🔄 Realtime update:', payload)
          fetchContent()
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContent])

  const handleEditDraft = (draft: ContentDraft) => {
    setCurrentDraft(draft)
    setActiveTab('editor')
  }
  
  const handlePublishDraft = async (draft: ContentDraft) => {
    if (!confirm(`Tem certeza que deseja publicar o artigo: ${draft.title}?`)) return;
    
    // Simulação de publicação rápida (se o editor não for necessário)
    // Em um sistema real, o AdvancedEditor faria a publicação completa.
    // Aqui, forçamos a abertura do editor para garantir que o usuário revise antes de publicar.
    handleEditDraft(draft)
    showError('Por favor, use o botão "Publicar" dentro do Editor Avançado para garantir a revisão final.')
  }
  
  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Tem certeza que deseja excluir este rascunho?')) return;
    
    const toastId = showLoading('Excluindo rascunho...')
    try {
      const { error } = await supabase
        .from('content_drafts')
        .delete()
        .eq('id', draftId)

      if (error) throw error
      
      dismissToast(toastId)
      showSuccess('Rascunho excluído com sucesso!')
      fetchContent()
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao excluir rascunho: ' + error.message)
    }
  }
  
  const handleDeletePublished = async (postId: string) => {
    const toastId = showLoading('Excluindo artigo publicado...')
    try {
      // 1. Excluir da tabela de artigos publicados
      const { error: publishedError } = await supabase
        .from('published_articles')
        .delete()
        .eq('id', postId)
        
      if (publishedError) throw publishedError
      
      // 2. Excluir da tabela de rascunhos (onde o status é 'published')
      const { error: draftError } = await supabase
        .from('content_drafts')
        .delete()
        .eq('id', postId)
        
      if (draftError) throw draftError

      dismissToast(toastId)
      showSuccess('Artigo excluído permanentemente com sucesso!')
      fetchContent()
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao excluir artigo: ' + error.message)
    }
  }
  
  const handleViewSerp = (post: ContentDraft) => {
    const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(post.title || post.keyword)}`;
    window.open(serpUrl, '_blank');
  }
  
  const handleContentGenerated = async (draftId: string) => {
    // Busca o rascunho recém-criado para abrir no editor
    const { data } = await supabase.from('content_drafts').select('*').eq('id', draftId).single()
    if (data) {
        setCurrentDraft(data as ContentDraft)
        setActiveTab('editor')
    }
  }
  
  const handleCloseEditor = () => {
    setCurrentDraft(null)
    setActiveTab('drafts')
    fetchContent()
  }

  if (loading) {
    return (
      <div className="flex justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles de Geração de Conteúdo */}
      <ContentGenerationControls 
        onContentGenerated={handleContentGenerated}
        onSetTab={setActiveTab}
      />

      {/* Tabs de Gerenciamento */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="drafts">Rascunhos ({drafts.length})</TabsTrigger>
          <TabsTrigger value="published">Publicados ({published.length})</TabsTrigger>
          <TabsTrigger value="editor" disabled={!currentDraft}>
            <Edit className="w-4 h-4 mr-1" /> Editor Avançado
          </TabsTrigger>
        </TabsList>

        {/* Aba Rascunhos */}
        <TabsContent value="drafts">
          <DraftsList
            drafts={drafts}
            loading={loading}
            onEdit={handleEditDraft}
            onPublish={handlePublishDraft}
            onDelete={handleDeleteDraft}
          />
        </TabsContent>

        {/* Aba Publicados */}
        <TabsContent value="published">
          <PublishedList
            published={published}
            loading={loading}
            onEdit={handleEditDraft}
            onViewSerp={handleViewSerp}
            onDelete={handleDeletePublished} // Adicionado
          />
        </TabsContent>

        {/* Aba Editor Avançado */}
        <TabsContent value="editor">
          {currentDraft ? (
            <AdvancedEditor
              initialDraft={currentDraft}
              categories={categories}
              onCloseEditor={handleCloseEditor}
              onDraftUpdated={fetchContent}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Edit className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecione um rascunho para editar</h2>
                <p className="text-gray-600">Vá para a aba 'Rascunhos' ou gere um novo artigo acima.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Gerenciador de Categorias */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Target className="w-6 h-6 mr-2" />
            Gerenciar Categorias do Blog
          </h2>
          <p className="text-gray-600 mb-4">
            Adicione ou edite as categorias que serão usadas nos artigos.
          </p>
          <BlogCategoryManager />
        </CardContent>
      </Card>
    </div>
  )
}

export default ContentManagerTab