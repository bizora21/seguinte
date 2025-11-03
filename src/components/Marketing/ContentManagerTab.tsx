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

interface ContentDraft {
  id: string
  title: string
  slug: string
  meta_description: string
  content: string
  keyword: string
  context: string
  audience: string
  seo_score: number
  status: 'draft' | 'published'
  created_at: string
  published_at: string | null
}

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
      // Fetch Drafts
      const { data: draftsData } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        
      // Fetch Published (from the renamed table)
      const { data: publishedData } = await supabase
        .from('published_articles')
        .select('id, title, slug, published_at, seo_score')
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
      
      const response = await fetch(EDGE_FUNCTION_URL, { // USANDO URL ABSOLUTA
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
    if (!window.confirm(`Tem certeza que deseja publicar o artigo: ${draft.title}?`)) return;
    
    const toastId = showLoading('Publicando artigo...')
    
    try {
      // 1. Mover o rascunho para a tabela de artigos publicados
      const { error: publishError } = await supabase
        .from('published_articles')
        .insert({
          ...draft,
          status: 'published',
          published_at: new Date().toISOString(),
          // Remove campos específicos de rascunho se houver
          id: undefined, // Deixa o banco gerar um novo ID para o artigo publicado
        })
        .select()
        .single()

      if (publishError) throw publishError;

      // 2. Marcar o rascunho como 'published' na tabela de rascunhos (ou deletar, mas marcamos para histórico)
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
      showError(`Erro ao publicar: ${error.message}`)
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

  const saveDraftChanges = async () => {
    if (!currentDraft) return;
    
    const toastId = showLoading('Salvando alterações...')
    
    try {
      const { error } = await supabase
        .from('content_drafts')
        .update({
          title: currentDraft.title,
          meta_description: currentDraft.meta_description,
          content: currentDraft.content,
          // Adicione outros campos editáveis aqui
        })
        .eq('id', currentDraft.id);
        
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

  const editDraft = (draft: ContentDraft) => {
    setCurrentDraft(draft);
    setActiveTab('editor');
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Edit className="w-6 h-6 mr-2" />
                  Editor Avançado: {currentDraft.title}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <BarChart3 className="w-3 h-3 mr-1" /> SEO Score: {currentDraft.seo_score}%
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Globe className="w-3 h-3 mr-1" /> Contexto: {currentDraft.context}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <Input 
                    value={currentDraft.title} 
                    onChange={(e) => setCurrentDraft(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Meta Descrição</label>
                  <Textarea 
                    value={currentDraft.meta_description} 
                    onChange={(e) => setCurrentDraft(prev => prev ? { ...prev, meta_description: e.target.value } : null)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Conteúdo (Markdown)</label>
                  <Textarea 
                    value={currentDraft.content} 
                    onChange={(e) => setCurrentDraft(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={20}
                    className="font-mono"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button onClick={saveDraftChanges} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
                  </Button>
                  <Button onClick={() => publishDraft(currentDraft)} className="bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-2" /> Publicar Agora
                  </Button>
                  <Button onClick={() => setActiveTab('drafts')} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
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