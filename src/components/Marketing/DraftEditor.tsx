import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label' // Importação adicionada
import { Badge } from '../ui/badge'
import { Save, Send, X, Edit, BarChart3, Globe, Link as LinkIcon, ExternalLink, Trash2, Plus, Eye, FileText } from 'lucide-react' // FileText adicionado
import { ContentDraft, BlogCategory, LinkItem } from '../../types/blog'
import { showSuccess, showError } from '../../utils/toast'
import OptimizedImageUpload from './OptimizedImageUpload'
import BlogCategoryManager from './BlogCategoryManager'
import { Separator } from '../ui/separator'

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

// Função auxiliar para renderizar Markdown simples (para preview)
const renderMarkdownPreview = (content: string) => {
  const htmlContent = content
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\* (.*)/g, '<li>$1</li>')
    .replace(/\[CTA: (.*)\]/g, '<div class="my-6 text-center"><a href="/register" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">Chamada para Ação</a></div>')
    
  const listRegex = /(<li>.*<\/li>)/gs
  const finalContent = htmlContent.replace(listRegex, (match) => `<ul>${match}</ul>`)

  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: finalContent }} />
}

const DraftEditor: React.FC<DraftEditorProps> = ({ draft, categories, onSave, onPublish, onCancel }) => {
  const [localDraft, setLocalDraft] = useState(draft)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Garante que o estado local é atualizado se o rascunho externo mudar (ao trocar de aba)
  useEffect(() => {
    setLocalDraft(draft)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <Edit className="w-6 h-6 mr-2" />
          Editor Avançado: {localDraft.title}
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm">
          <Badge className="bg-yellow-100 text-yellow-800">
            <BarChart3 className="w-3 h-3 mr-1" /> SEO Score: {localDraft.seo_score}%
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
          <Button onClick={handlePublishClick} disabled={publishing || saving || !localDraft.featured_image_url || !localDraft.category_id} className="bg-green-600 hover:bg-green-700">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-yellow-600" />
                    Otimização SEO
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
                  <Textarea 
                    value={localDraft.content || ''} 
                    onChange={(e) => handleUpdate('content', e.target.value)}
                    rows={25}
                    className="font-mono text-sm"
                    placeholder="O conteúdo gerado pela IA aparecerá aqui. Use Markdown para formatar."
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