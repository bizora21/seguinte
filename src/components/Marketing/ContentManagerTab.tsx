import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2, Edit } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { ContentDraft, BlogCategory } from '../../types/blog'
import AdvancedEditor from './AdvancedEditor' // NOVO IMPORT
import ContentGenerationControls from './ContentGenerationControls'
import DraftsList from './DraftsList'
import PublishedList from './PublishedList'

const ContentManagerTab: React.FC = () => {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  const [published, setPublished] = useState<ContentDraft[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDraft, setCurrentDraft] = useState<ContentDraft | null>(null)
  const [activeTab, setActiveTab] = useState('drafts')

  const loadContent = useCallback(async () => {
    setLoading(true)
    try {
      // Usando Promise.all para buscar dados em paralelo
      const [catResult, draftsResult, publishedResult] = await Promise.all([
        supabase.from('blog_categories').select('*').order('name'),
        supabase.from('content_drafts').select('*').eq('status', 'draft').order('created_at', { ascending: false }),
        supabase.from('published_articles').select('id, title, slug, published_at, seo_score, content, meta_description, featured_image_url, image_alt_text, external_links, internal_links, secondary_keywords, readability_score, category_id, image_prompt, keyword, context, audience').order('published_at', { ascending: false }),
      ])
      
      if (catResult.error) throw catResult.error
      if (draftsResult.error) throw draftsResult.error
      if (publishedResult.error) throw publishedResult.error
      
      setCategories(catResult.data as BlogCategory[] || [])
      setDrafts(draftsResult.data as ContentDraft[] || [])
      setPublished(publishedResult.data as ContentDraft[] || [])
      
    } catch (error) {
      console.error('Error loading content:', error)
      showError('Erro ao carregar conteúdo. Tente recarregar a página.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContent()
    
    // Setup Realtime Subscription
    const channel = supabase
      .channel('content_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'content_drafts' },
        (payload) => {
          console.log('🔄 Realtime update:', payload)
          loadContent()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadContent])

  const handleContentGenerated = async (draftId: string) => {
    // Tenta carregar o rascunho recém-criado para edição imediata
    const { data: newDraft } = await supabase.from('content_drafts').select('*').eq('id', draftId).single()
    if (newDraft) {
        setCurrentDraft(newDraft as ContentDraft)
    }
    loadContent()
  }

  const handleEditDraft = async (contentItem: ContentDraft) => {
    if (contentItem.status === 'published') {
        const toastId = showLoading('Criando rascunho para edição...')
        
        const { data: publishedArticle, error: fetchError } = await supabase
            .from('published_articles')
            .select('*')
            .eq('id', contentItem.id)
            .single()
            
        if (fetchError || !publishedArticle) {
            dismissToast(toastId)
            showError('Erro ao buscar artigo publicado para edição.')
            return
        }
        
        // 2. Criar um novo rascunho (ContentDraft) com os dados do publicado
        const newDraftData: Partial<ContentDraft> = {
            user_id: user?.id,
            keyword: publishedArticle.keyword || 'Edição de Artigo',
            context: publishedArticle.context || 'nacional',
            audience: publishedArticle.audience || 'geral',
            status: 'draft',
            title: publishedArticle.title,
            slug: publishedArticle.slug,
            meta_description: publishedArticle.meta_description,
            content: publishedArticle.content, // Conteúdo JSON (TipTap)
            featured_image_url: publishedArticle.featured_image_url,
            image_alt_text: publishedArticle.image_alt_text,
            external_links: publishedArticle.external_links,
            internal_links: publishedArticle.internal_links,
            secondary_keywords: publishedArticle.secondary_keywords,
            seo_score: publishedArticle.seo_score,
            readability_score: publishedArticle.readability_score,
            category_id: publishedArticle.category_id,
            image_prompt: publishedArticle.image_prompt,
        }
        
        const { data: newDraft, error: insertError } = await supabase
            .from('content_drafts')
            .insert(newDraftData)
            .select()
            .single()
            
        dismissToast(toastId)
        
        if (insertError) {
            showError('Falha ao criar rascunho de edição: ' + insertError.message)
            return
        }
        
        showSuccess('Rascunho de edição criado com sucesso! Lembre-se de atualizar o slug antes de republicar.')
        setCurrentDraft(newDraft as ContentDraft)
        setActiveTab('editor')
        
    } else {
        // Se for rascunho, edita diretamente
        setCurrentDraft(contentItem);
        setActiveTab('editor');
    }
  }

  const handleSaveDraft = async (draftToSave: ContentDraft) => {
    const toastId = showLoading('Salvando alterações...')
    
    try {
      const updateData = {
        title: draftToSave.title,
        slug: draftToSave.slug,
        meta_description: draftToSave.meta_description,
        content: draftToSave.content,
        featured_image_url: draftToSave.featured_image_url,
        image_alt_text: draftToSave.image_alt_text,
        external_links: draftToSave.external_links,
        internal_links: draftToSave.internal_links,
        secondary_keywords: draftToSave.secondary_keywords,
        category_id: draftToSave.category_id,
        image_prompt: draftToSave.image_prompt,
        seo_score: draftToSave.seo_score,
        readability_score: draftToSave.readability_score,
      }
      
      const { error } = await supabase
        .from('content_drafts')
        .update(updateData)
        .eq('id', draftToSave.id);
        
      if (error) throw error;
      
      dismissToast(toastId)
      showSuccess('Rascunho salvo com sucesso!');
      loadContent();
    } catch (error) {
      dismissToast(toastId)
      console.error('Error saving draft:', error);
      showError('Erro ao salvar rascunho');
    }
  }

  const handlePublishDraft = async (draft: ContentDraft) => {
    if (!draft.slug) {
        showError('O slug do artigo não pode estar vazio. Edite na aba Editor.');
        return;
    }
    
    const toastId = showLoading('Publicando artigo...')
    
    try {
      // 1. Tentar inserir/atualizar na tabela de artigos publicados
      const articleData = {
          title: draft.title,
          slug: draft.slug,
          meta_description: draft.meta_description,
          content: draft.content, // Conteúdo JSON (TipTap)
          featured_image_url: draft.featured_image_url,
          image_alt_text: draft.image_alt_text,
          external_links: draft.external_links,
          internal_links: draft.internal_links,
          secondary_keywords: draft.secondary_keywords,
          seo_score: draft.seo_score,
          readability_score: draft.readability_score,
          category_id: draft.category_id,
          image_prompt: draft.image_prompt,
          status: 'published',
          published_at: new Date().toISOString(),
          context: draft.context,
          audience: draft.audience,
          keyword: draft.keyword,
      }
      
      // Verifica se já existe um artigo publicado com este ID (se for uma republicação)
      const existingPublished = published.find(p => p.id === draft.id);
      
      let publishError;
      
      if (existingPublished) {
          // Se o rascunho foi criado a partir de um publicado, atualizamos o publicado original
          const { error } = await supabase
              .from('published_articles')
              .update(articleData)
              .eq('id', draft.id)
          publishError = error;
      } else {
          // Se for um rascunho novo, inserimos
          const { error } = await supabase
              .from('published_articles')
              .insert(articleData)
          publishError = error;
      }

      if (publishError) throw publishError;

      // 2. Marcar o rascunho como 'published' na tabela de rascunhos
      const { error: draftUpdateError } = await supabase
        .from('content_drafts')
        .update({ status: 'published' })
        .eq('id', draft.id);
        
      if (draftUpdateError) throw draftUpdateError;

      dismissToast(toastId)
      showSuccess('Artigo publicado com sucesso!')
      loadContent()
      setActiveTab('published')
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error publishing draft:', error)
      
      let errorMessage = `Erro ao publicar: ${error.message}`;
      
      if (error.code === '23505') {
          errorMessage = `Erro de Conflito (Slug Duplicado): O endereço URL (slug) "${draft.slug}" já está em uso por outro artigo. Por favor, edite o slug na aba 'Editor' para torná-lo único.`;
      }
      
      showError(errorMessage)
    }
  }
  
  const handleDeleteDraft = async (draftId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este rascunho?')) return;
    
    try {
      const { error } = await supabase
        .from('content_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      showSuccess('Rascunho excluído com sucesso!');
      loadContent();
    } catch (error) {
      console.error('Error deleting draft:', error);
      showError('Erro ao excluir rascunho');
    }
  }

  const handleViewSerp = (post: ContentDraft) => {
    const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(post.title)}`;
    window.open(serpUrl, '_blank');
  }

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <ContentGenerationControls 
        onContentGenerated={handleContentGenerated}
        onSetTab={setActiveTab}
      />

      {/* Content Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="drafts">Rascunhos ({drafts.length})</TabsTrigger>
          <TabsTrigger value="published">Publicados ({published.length})</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>

        {/* Tab: Drafts */}
        <TabsContent value="drafts">
          <DraftsList 
            drafts={drafts}
            loading={loading}
            onEdit={handleEditDraft}
            onPublish={handlePublishDraft}
            onDelete={handleDeleteDraft}
          />
        </TabsContent>

        {/* Tab: Published */}
        <TabsContent value="published">
          <PublishedList 
            published={published}
            loading={loading}
            onEdit={handleEditDraft}
            onViewSerp={handleViewSerp}
          />
        </TabsContent>

        {/* Tab: Editor */}
        <TabsContent value="editor">
          {currentDraft ? (
            <AdvancedEditor // Usando o novo AdvancedEditor
              draft={currentDraft}
              categories={categories}
              onSave={handleSaveDraft}
              onPublish={handlePublishDraft}
              onCancel={() => setActiveTab('drafts')}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Edit className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecione um rascunho para editar</h2>
                <p className="text-gray-600">Vá para a aba 'Rascunhos' ou gere um novo artigo.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ContentManagerTab