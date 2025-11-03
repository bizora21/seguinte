import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { AlertCircle, CheckCircle, Edit, Eye, Send, Zap, Target, Globe, FileText, BarChart3, Loader2, ArrowRight, Trash2, Save } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { ContentDraft, BlogCategory } from '../../types/blog'
import DraftEditor from './DraftEditor' // Importando o novo editor

const CONTEXT_OPTIONS = [
  { value: 'maputo', label: 'Maputo e Região' },
  { value: 'beira', label: 'Beira e Sofala' },
  { value: 'nampula', label: 'Nampula e Norte' },
  { value: 'nacional', label: 'Nacional (Todo MZ)' },
]

const AUDIENCE_OPTIONS = [
  { value: 'vendedores', label: 'Vendedores e Empreendedores' },
  { value: 'clientes', label: 'Consumidores e Compradores' },
  { value: 'geral', label: 'Público Geral' },
]

const TYPE_OPTIONS = [
  { value: 'guia-completo', label: 'Guia Completo' },
  { value: 'dicas-praticas', label: 'Dicas Práticas' },
  { value: 'tendencias', label: 'Análise de Tendências' },
]

// URL ABSOLUTA DA EDGE FUNCTION
const EDGE_FUNCTION_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator'

const ContentManagerTab: React.FC = () => {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  const [published, setPublished] = useState<ContentDraft[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentDraft, setCurrentDraft] = useState<ContentDraft | null>(null)
  const [activeTab, setActiveTab] = useState('drafts')

  const [keyword, setKeyword] = useState('')
  const [context, setContext] = useState('maputo')
  const [audience, setAudience] = useState('vendedores')
  const [contentType, setContentType] = useState('guia-completo')

  const loadContent = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch Categories
      const { data: catData } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')
      setCategories(catData as BlogCategory[] || [])
      
      // Fetch Drafts
      const { data: draftsData } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        
      // Fetch Published (from the renamed table)
      const { data: publishedData } = await supabase
        .from('published_articles')
        .select('id, title, slug, published_at, seo_score, content, meta_description, featured_image_url, image_alt_text, external_links, internal_links, secondary_keywords, readability_score, category_id, image_prompt, keyword, context, audience')
        .order('published_at', { ascending: false })
      
      setDrafts(draftsData as ContentDraft[] || [])
      setPublished(publishedData as ContentDraft[] || [])
    } catch (error) {
      console.error('Error loading content:', error)
      showError('Erro ao carregar conteúdo.')
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

  const generateContent = async () => {
    if (!keyword.trim()) {
      showError('Por favor, insira uma palavra-chave principal.')
      return
    }

    setGenerating(true)
    const toastId = showLoading('Gerando conteúdo com IA...')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'generate',
          keyword: keyword.trim(),
          context,
          audience,
          type: contentType
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        dismissToast(toastId)
        throw new Error(`Falha na requisição (Status ${response.status}): ${errorText.substring(0, 100)}...`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        dismissToast(toastId)
        showSuccess(`Conteúdo gerado! Revise na aba Rascunhos.`)
        // Tenta carregar o rascunho recém-criado para edição imediata
        if (result.draftId) {
            const { data: newDraft } = await supabase.from('content_drafts').select('*').eq('id', result.draftId).single()
            if (newDraft) {
                setCurrentDraft(newDraft as ContentDraft)
                setActiveTab('editor')
            }
        }
      } else {
        dismissToast(toastId)
        throw new Error(result.error || 'Erro desconhecido na Edge Function.')
      }
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error generating content:', error)
      showError(`Falha na geração: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const publishDraft = async (draft: ContentDraft) => {
    if (draft.status === 'published') {
        showError('Este rascunho já foi publicado. Edite o artigo diretamente na aba "Publicados".');
        return;
    }
    
    if (!draft.slug) {
        showError('O slug do artigo não pode estar vazio. Edite na aba Editor.');
        return;
    }
    
    const toastId = showLoading('Publicando artigo...')
    
    try {
      // 1. Mover o rascunho para a tabela de artigos publicados
      const { error: publishError } = await supabase
        .from('published_articles')
        .insert({
          // Mapeamento explícito dos campos para a tabela published_articles
          title: draft.title,
          slug: draft.slug,
          meta_description: draft.meta_description,
          content: draft.content,
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
          context: draft.context, // Adicionado
          audience: draft.audience, // Adicionado
        })
        .select()
        .single()

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
      
      // Check for unique constraint violation (code 23505)
      if (error.code === '23505') {
          errorMessage = `Erro de Conflito (Slug Duplicado): O endereço URL (slug) "${draft.slug}" já está em uso por outro artigo. Por favor, edite o slug na aba 'Editor' para torná-lo único.`;
      }
      
      showError(errorMessage)
    }
  }
  
  const deleteDraft = async (draftId: string) => {
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

  const saveDraftChanges = async (draftToSave: ContentDraft) => {
    const toastId = showLoading('Salvando alterações...')
    
    try {
      // Mapeia o rascunho local para o formato de atualização do banco
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
        // Mantém os campos de geração (keyword, context, audience)
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

  const editDraft = async (contentItem: ContentDraft) => {
    if (contentItem.status === 'published') {
        // Se for publicado, criamos um novo rascunho a partir dele
        const toastId = showLoading('Criando rascunho para edição...')
        
        // 1. Buscar dados completos do artigo publicado
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
            slug: `${publishedArticle.slug}-edit-${Date.now()}`, // Novo slug temporário
            meta_description: publishedArticle.meta_description,
            content: publishedArticle.content,
            featured_image_url: publishedArticle.featured_image_url,
            image_alt_text: publishedArticle.image_alt_text,
            external_links: publishedArticle.external_links,
            internal_links: publishedArticle.internal_links,
            secondary_keywords: publishedArticle.secondary_keywords,
            seo_score: publishedArticle.seo_score,
            readability_score: publishedArticle.readability_score,
            category_id: publishedArticle.category_id,
            image_prompt: publishedArticle.image_prompt,
            // Não copiamos o published_at
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

  const viewSerp = (post: ContentDraft) => {
    // Simulação de SERP Preview
    const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(post.title)}`;
    window.open(serpUrl, '_blank');
  }

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

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Target className="w-6 h-6 mr-2" />
            Motor de Conteúdo Nível Profissional
          </CardTitle>
          <p className="text-sm text-green-700">Gere conteúdo otimizado para SEO local, Google Discover e o mercado moçambicano</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Palavra-chave Principal</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ex: vender eletrônicos online" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Público-Alvo</label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tipo de Conteúdo</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Contexto Local</label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTEXT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={generateContent} 
            disabled={generating || !keyword.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {generating ? (
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando conteúdo...
              </div>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Gerar Artigo Hiper-Localizado
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Content Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="drafts">Rascunhos ({drafts.length})</TabsTrigger>
          <TabsTrigger value="published">Publicados ({published.length})</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>

        {/* Drafts Tab */}
        <TabsContent value="drafts">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center h-32"><LoadingSpinner /></div>
            ) : drafts.length === 0 ? (
              <Card><CardContent className="p-12 text-center"><FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum rascunho</h2><p className="text-gray-600">Gere seu primeiro artigo com IA</p></CardContent></Card>
            ) : (
              drafts.map((draft) => (
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
                        <Button onClick={() => editDraft(draft)} size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-1" /> Revisar
                        </Button>
                        <Button onClick={() => publishDraft(draft)} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Send className="w-4 h-4 mr-1" /> Publicar
                        </Button>
                        <Button onClick={() => deleteDraft(draft.id)} size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Published Tab */}
        <TabsContent value="published">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center h-32"><LoadingSpinner /></div>
            ) : published.length === 0 ? (
              <Card><CardContent className="p-12 text-center"><CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" /><h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum artigo publicado</h2><p className="text-gray-600">Publique um rascunho para vê-lo aqui.</p></CardContent></Card>
            ) : (
              published.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow border-green-400">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                        <p className="text-sm text-gray-600">Publicado em: {formatDate(post.published_at)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => viewSerp(post)} size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" /> Ver SERP
                        </Button>
                        <Button onClick={() => editDraft(post)} size="sm" variant="secondary">
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor">
          {currentDraft ? (
            <DraftEditor 
              draft={currentDraft}
              categories={categories}
              onSave={saveDraftChanges}
              onPublish={publishDraft}
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