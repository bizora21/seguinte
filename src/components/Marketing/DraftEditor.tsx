import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Save, Send, X, Edit, BarChart3, Globe, Link as LinkIcon, ExternalLink, Trash2, Plus, Eye, FileText, Zap, CheckCircle, AlertTriangle, Loader2, Lightbulb } from 'lucide-react'
import { ContentDraft, BlogCategory, LinkItem } from '../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import OptimizedImageUpload from './OptimizedImageUpload'
import BlogCategoryManager from './BlogCategoryManager'
import { Separator } from '../ui/separator'
import { supabase } from '../../lib/supabase'
import MarkdownEditor from './MarkdownEditor' // NOVO IMPORT

interface DraftEditorProps {
  draft: ContentDraft
  categories: BlogCategory[]
  onSave: (draft: ContentDraft) => Promise<void>
  onPublish: (draft: ContentDraft) => Promise<void>
  onCancel: () => void
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

// URL ABSOLUTA DA EDGE FUNCTION
const CONTENT_GENERATOR_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator'

// Função auxiliar para renderizar Markdown simples (usando o 'prose' do Tailwind)
const renderMarkdownPreview = (content: string) => {
  // 1. Substituições Markdown para HTML
  let htmlContent = content
    // Substituir negrito **texto** por <strong>texto</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Substituir CTA [CTA: Texto]
    .replace(/\[CTA: (.*?)\]/g, '<div class="my-6 text-center"><a href="/register" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">$1</a></div>');

  // 2. Processamento de linhas para blocos HTML
  const lines = htmlContent.split('\n');
  let finalHtml = '';
  let inList = false;
  let currentParagraph = '';

  const flushParagraph = () => {
    if (currentParagraph.trim().length > 0) {
      finalHtml += `<p>${currentParagraph.trim()}</p>`;
      currentParagraph = '';
    }
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      // Linha vazia: fecha parágrafo e lista
      flushParagraph();
      if (inList) {
        finalHtml += '</ul>';
        inList = false;
      }
      return;
    }

    if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ') || trimmedLine.startsWith('# ')) {
      // Título: fecha parágrafo e lista, adiciona título
      flushParagraph();
      if (inList) {
        finalHtml += '</ul>';
        inList = false;
      }
      if (trimmedLine.startsWith('### ')) {
        finalHtml += `<h3>${trimmedLine.substring(4)}</h3>`;
      } else if (trimmedLine.startsWith('## ')) {
        finalHtml += `<h2>${trimmedLine.substring(3)}</h2>`;
      } else if (trimmedLine.startsWith('# ')) {
        finalHtml += `<h1>${trimmedLine.substring(2)}</h1>`;
      }
    } else if (trimmedLine.startsWith('* ')) {
      // Item de lista: fecha parágrafo
      flushParagraph();
      const listItem = trimmedLine.replace(/^\* (.*)/, '<li>$1</li>');
      if (!inList) {
        finalHtml += '<ul>';
        inList = true;
      }
      finalHtml += listItem;
    } else if (trimmedLine.startsWith('<div')) {
      // CTA: fecha parágrafo e lista, adiciona div
      flushParagraph();
      if (inList) {
        finalHtml += '</ul>';
        inList = false;
      }
      finalHtml += trimmedLine;
    } else {
      // Conteúdo de parágrafo: acumula
      if (inList) {
        // Se estiver em uma lista, mas a linha não for um item de lista, fecha a lista
        finalHtml += '</ul>';
        inList = false;
      }
      currentParagraph += (currentParagraph.length > 0 ? ' ' : '') + trimmedLine;
    }
  });
  
  // Flush final
  flushParagraph();
  if (inList) {
    finalHtml += '</ul>';
  }

  // Remove parágrafos vazios duplicados que podem ter sido inseridos
  finalHtml = finalHtml.replace(/<p><\/p>/g, '');

  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: finalHtml }} />
}

const DraftEditor: React.FC<DraftEditorProps> = ({ draft, categories, onSave, onPublish, onCancel }) => {
  const [localDraft, setLocalDraft] = useState(draft)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [seoSuggestions, setSeoSuggestions] = useState<string[]>([]) // Novo estado para sugestões

  // Garante que o estado local é atualizado se o rascunho externo mudar (ao trocar de aba)
  useEffect(() => {
    setLocalDraft(draft)
    // Limpa sugestões ao carregar novo rascunho
    setSeoSuggestions([])
  }, [draft])

  const handleUpdate = (field: keyof ContentDraft, value: any) => {
    setLocalDraft(prev => ({ ...prev, [field]: value }))
  }
  
  const handleLinkUpdate = (type: 'internal_links' | 'external_links', index: number, field: keyof LinkItem, value: string) => {
    const links = (localDraft[type] || []) as LinkItem[]
    const updatedLinks = links.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    )
    handleUpdate(type, updatedLinks)
  }
  
  const handleLinkAdd = (type: 'internal_links' | 'external_links') => {
    const links = (localDraft[type] || []) as LinkItem[]
    handleUpdate(type, [...links, { title: '', url: '' }])
  }
  
  const handleLinkRemove = (type: 'internal_links' | 'external_links', index: number) => {
    const links = (localDraft[type] || []) as LinkItem[]
    const updatedLinks = links.filter((_, i) => i !== index)
    handleUpdate(type, updatedLinks)
  }

  const handleSaveClick = async () => {
    setSaving(true)
    await onSave(localDraft)
    setSaving(false)
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
    setPublishing(true)
    await onPublish(localDraft)
    setPublishing(false)
  }
  
  const getSeoColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  const currentCategory = categories.find(c => c.id === localDraft.category_id)
  
  // --- Análise SEO em Tempo Real (Simulada) ---
  const seoAnalysis = useMemo(() => {
    const analysis = {
      keywordDensity: 0,
      titleLength: localDraft.title?.length || 0,
      metaLength: localDraft.meta_description?.length || 0,
      readability: localDraft.readability_score || 'N/A',
      issues: [] as string[],
    }
    
    // Simulação de problemas
    if (analysis.titleLength < 40 || analysis.titleLength > 60) {
      analysis.issues.push('Título fora do tamanho ideal (40-60 caracteres).')
    }
    if (analysis.metaLength < 100 || analysis.metaLength > 160) {
      analysis.issues.push('Meta descrição fora do tamanho ideal (100-160 caracteres).')
    }
    if (!localDraft.featured_image_url) {
      analysis.issues.push('Imagem de destaque ausente.')
    }
    if (!localDraft.image_alt_text || localDraft.image_alt_text.length < 10) {
      analysis.issues.push('Texto Alt da imagem muito curto ou ausente.')
    }
    if (localDraft.content && localDraft.content.split(' ').length < 800) {
      analysis.issues.push('Conteúdo abaixo do mínimo recomendado (1200 palavras simuladas).')
    }
    
    // Simulação de densidade de palavra-chave
    if (localDraft.content && localDraft.keyword) {
        const keywordCount = (localDraft.content.toLowerCase().match(new RegExp(localDraft.keyword.toLowerCase(), 'g')) || []).length;
        const wordCount = localDraft.content.split(/\s+/).length;
        analysis.keywordDensity = (keywordCount / wordCount) * 100;
        if (analysis.keywordDensity < 0.5 || analysis.keywordDensity > 2.5) {
            analysis.issues.push(`Densidade da palavra-chave (${analysis.keywordDensity.toFixed(2)}%) fora do ideal (0.5% - 2.5%).`);
        }
    }

    return analysis
  }, [localDraft])
  
  const handleAnalyzeSEO = async () => {
    setAnalyzing(true)
    const toastId = showLoading('Reanalisando SEO e Palavras-chave com IA...')
    
    try {
      // OBTENDO O TOKEN DE ACESSO ATUAL
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        dismissToast(toastId)
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }
      
      const response = await fetch(CONTENT_GENERATOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ENVIANDO O TOKEN DE ACESSO
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'reanalyze',
          draft: localDraft, // Envia o rascunho atual para análise
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        dismissToast(toastId)
        // Tenta analisar o erro JSON da Edge Function
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Falha na requisição (Status ${response.status})`);
        } catch {
            throw new Error(`Falha na requisição (Status ${response.status}): ${errorText.substring(0, 100)}...`);
        }
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Atualiza o rascunho local com os novos dados de SEO
        setLocalDraft(prev => ({
            ...prev,
            seo_score: result.data.seo_score,
            readability_score: result.data.readability_score,
        }))
        // Define as sugestões
        setSeoSuggestions(result.data.suggestions || [])
        
        dismissToast(toastId)
        showSuccess('Análise SEO concluída! Score e sugestões atualizados.')
      } else {
        dismissToast(toastId)
        throw new Error(result.error || 'Erro desconhecido na Edge Function de reanálise.')
      }
      
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error reanalyzing SEO:', error)
      showError(`Falha na reanálise: ${error.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <Edit className="w-6 h-6 mr-2" />
          Editor Avançado: {localDraft.title}
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm">
          <Badge className="bg-yellow-100 text-yellow-800">
            <BarChart3 className="w-3 h-3 mr-1" /> SEO Score: <span className={`font-bold ${getSeoColor(localDraft.seo_score)}`}>{localDraft.seo_score}%</span>
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            <Globe className="w-3 h-3 mr-1" /> Contexto: {localDraft.context}
          </Badge>
          <Badge className="bg-purple-100 text-purple-800">
            <Eye className="w-3 h-3 mr-1" /> Público: {localDraft.audience}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Botões de Ação */}
        <div className="flex space-x-4 border-b pb-4">
          <Button onClick={handleSaveClick} disabled={saving || publishing} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
          <Button onClick={handlePublishClick} disabled={publishing || saving || !localDraft.featured_image_url || !localDraft.category_id || !localDraft.slug} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-2" /> {publishing ? 'Publicando...' : 'Publicar Agora'}
          </Button>
          <Button onClick={() => setPreviewMode(!previewMode)} variant="outline">
            <Eye className="w-4 h-4 mr-2" /> {previewMode ? 'Voltar ao Editor' : 'Pré-visualizar'}
          </Button>
          <Button onClick={onCancel} variant="destructive">
            <X className="w-4 h-4 mr-2" /> Cancelar Edição
          </Button>
        </div>
        
        {previewMode ? (
          // --- MODO PRÉ-VISUALIZAÇÃO ---
          <div className="p-6 bg-white border rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-4">{localDraft.title}</h2>
            <p className="text-gray-600 mb-6 italic">{localDraft.meta_description}</p>
            {localDraft.featured_image_url && (
              <img 
                src={localDraft.featured_image_url} 
                alt={localDraft.image_alt_text || localDraft.title || 'Imagem de destaque'} 
                className="w-full h-auto object-cover rounded-lg mb-6"
              />
            )}
            {localDraft.content && renderMarkdownPreview(localDraft.content)}
          </div>
        ) : (
          // --- MODO EDIÇÃO ---
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna 1: SEO e Metadados */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Análise SEO em Tempo Real */}
              <Card className={`border-2 ${seoAnalysis.issues.length > 0 ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Análise SEO em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Score Atual:</span>
                    <span className={`font-bold ${getSeoColor(localDraft.seo_score)}`}>{localDraft.seo_score}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Leitura:</span>
                    <span className="font-bold">{seoAnalysis.readability}</span>
                  </div>
                  
                  <Separator />
                  
                  <h4 className="font-semibold text-sm flex items-center">
                    {seoAnalysis.issues.length > 0 ? <AlertTriangle className="w-4 h-4 mr-1 text-red-600" /> : <CheckCircle className="w-4 h-4 mr-1 text-green-600" />}
                    {seoAnalysis.issues.length} Problema(s) Encontrado(s)
                  </h4>
                  
                  {seoAnalysis.issues.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                      {seoAnalysis.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                  )}
                  
                  <Button onClick={handleAnalyzeSEO} disabled={analyzing} variant="outline" className="w-full mt-3">
                    {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Reanalisar SEO
                  </Button>
                </CardContent>
              </Card>
              
              {/* Sugestões da IA */}
              {seoSuggestions.length > 0 && (
                <Card className="border-blue-400 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center text-blue-800">
                            <Lightbulb className="w-5 h-5 mr-2" />
                            Sugestões da IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm text-blue-800 space-y-2">
                            {seoSuggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}
                        </ul>
                    </CardContent>
                </Card>
              )}
              
              {/* SEO e Metadados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-yellow-600" />
                    Metadados Essenciais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título (H1)</Label>
                    <Input 
                      id="title"
                      value={localDraft.title} 
                      onChange={(e) => handleUpdate('title', e.target.value)}
                      placeholder="Título principal do artigo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input 
                      id="slug"
                      value={localDraft.slug || ''} 
                      onChange={(e) => handleUpdate('slug', e.target.value)}
                      placeholder="slug-do-artigo-aqui"
                    />
                    <p className="text-xs text-gray-500">
                      URL final: /blog/{localDraft.slug}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Descrição (Máx 160)</Label>
                    <Textarea 
                      id="meta_description"
                      value={localDraft.meta_description || ''} 
                      onChange={(e) => handleUpdate('meta_description', e.target.value)}
                      rows={2}
                      maxLength={160}
                      placeholder="Descrição curta para o Google"
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {localDraft.meta_description?.length || 0} / 160
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category_id">Categoria *</Label>
                    <Select 
                      value={localDraft.category_id || ''} 
                      onValueChange={(value) => handleUpdate('category_id', value)}
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentCategory && (
                      <p className="text-xs text-gray-500">Slug: {currentCategory.slug}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_keywords">Palavras-chave Secundárias</Label>
                    <Input
                      id="secondary_keywords"
                      value={(localDraft.secondary_keywords || []).join(', ')}
                      onChange={(e) => handleUpdate('secondary_keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                      placeholder="separadas por vírgula"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(localDraft.secondary_keywords || []).map((k, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Links Internos e Externos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Linkagem (SEO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-medium flex items-center text-sm">
                    <LinkIcon className="w-4 h-4 mr-1" /> Links Internos
                  </h4>
                  {(localDraft.internal_links || []).map((link, index) => (
                    <div key={index} className="space-y-2 border p-3 rounded-lg">
                      <Input 
                        value={link.title} 
                        onChange={(e) => handleLinkUpdate('internal_links', index, 'title', e.target.value)}
                        placeholder="Título do Link"
                      />
                      <Input 
                        value={link.url} 
                        onChange={(e) => handleLinkUpdate('internal_links', index, 'url', e.target.value)}
                        placeholder="URL (ex: /blog/outro-artigo)"
                      />
                      <Button variant="destructive" size="sm" onClick={() => handleLinkRemove('internal_links', index)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Remover
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handleLinkAdd('internal_links')} className="w-full">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Link Interno
                  </Button>
                  
                  <Separator />
                  
                  <h4 className="font-medium flex items-center text-sm">
                    <ExternalLink className="w-4 h-4 mr-1" /> Links Externos
                  </h4>
                  {(localDraft.external_links || []).map((link, index) => (
                    <div key={index} className="space-y-2 border p-3 rounded-lg">
                      <Input 
                        value={link.title} 
                        onChange={(e) => handleLinkUpdate('external_links', index, 'title', e.target.value)}
                        placeholder="Título do Link"
                      />
                      <Input 
                        value={link.url} 
                        onChange={(e) => handleLinkUpdate('external_links', index, 'url', e.target.value)}
                        placeholder="URL (ex: https://site.com)"
                      />
                      <Button variant="destructive" size="sm" onClick={() => handleLinkRemove('external_links', index)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Remover
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handleLinkAdd('external_links')} className="w-full">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Link Externo
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Coluna 2: Editor de Conteúdo e Imagem */}
            <div className="lg:col-span-2 space-y-6">
              <OptimizedImageUpload
                value={localDraft.featured_image_url || ''}
                altText={localDraft.image_alt_text || ''}
                imagePrompt={localDraft.image_prompt || ''}
                onImageChange={(url) => handleUpdate('featured_image_url', url)}
                onAltTextChange={(altText) => handleUpdate('image_alt_text', altText)}
                onPromptChange={(prompt) => handleUpdate('image_prompt', prompt)}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Conteúdo do Artigo (Markdown)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownEditor
                    label="Editor de Conteúdo"
                    value={localDraft.content || ''}
                    onChange={(value) => handleUpdate('content', value)}
                    placeholder="O conteúdo gerado pela IA aparecerá aqui. Use as ferramentas acima para formatar."
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DraftEditor