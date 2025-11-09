import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Separator } from '../../ui/separator'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { 
  FileText, Lightbulb, Search, 
  BarChart3, CheckCircle, AlertTriangle,
  Plus, Trash2, X, RefreshCw, Settings, Image as ImageIcon, Tag, Link as LinkIcon, Loader2, ExternalLink
} from 'lucide-react'
import { ContentDraft, BlogCategory, LocalDraftState, LinkItem } from '../../../types/blog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion'
import { Textarea } from '../../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import OptimizedImageUpload from '../OptimizedImageUpload'
import { supabase } from '../../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../../utils/toast'
import { CONTENT_GENERATOR_BASE_URL } from '../../../utils/admin'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  draft: LocalDraftState
  categories: BlogCategory[]
  onUpdateDraft: (draft: LocalDraftState) => void
  onGenerateWithAI: () => void
  wordCount: number
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, draft, categories, onUpdateDraft, onGenerateWithAI, wordCount }) => {
  const [isSuggestingLinks, setIsSuggestingLinks] = useState(false)

  const seoAnalysis = useMemo(() => {
    const contentText = (draft.content || '').replace(/<[^>]*>/g, ' ') || ''
    const keyword = draft.keyword || ''
    const keywordCount = keyword 
      ? (contentText.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      : 0
    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount * 100).toFixed(2) : '0.00'
    
    const issues: string[] = []
    if (wordCount < 1200) issues.push(`Comprimento: Mínimo 1200 palavras (Atual: ${wordCount}).`)
    if (parseFloat(keywordDensity) < 0.5 || parseFloat(keywordDensity) > 2.0) issues.push(`Densidade da Palavra-chave: Ideal 0.5%-2.0% (Atual: ${keywordDensity}%).`)
    if (!draft.meta_description || draft.meta_description.length < 50) issues.push('Meta Descrição curta ou ausente.')
    if (!draft.slug) issues.push('Slug (URL) não definido.')
    if (!draft.featured_image_url) issues.push('Imagem de Destaque ausente.')
    if (!draft.category_id) issues.push('Categoria ausente.')

    return {
      wordCount,
      keywordDensity,
      readabilityScore: draft.readability_score || 'N/A',
      seoScore: draft.seo_score || 0,
      issues
    }
  }, [draft, wordCount])
  
  const getSeoColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  const handleSuggestInternalLinks = useCallback(async () => {
    if (!draft.id || !draft.content) {
      showError('Salve o rascunho com algum conteúdo primeiro.');
      return;
    }

    setIsSuggestingLinks(true);
    const toastId = showLoading('IA está a ler o seu artigo para encontrar os melhores links...');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error('Usuário não autenticado.');

      const response = await fetch(CONTENT_GENERATOR_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'suggest_internal_links',
          draftId: draft.id,
          content: draft.content,
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha na requisição.');

      if (result.success && result.internal_links) {
        dismissToast(toastId);
        showSuccess(`${result.internal_links.length} link(s) interno(s) sugerido(s)!`);
        onUpdateDraft({ ...draft, internal_links: result.internal_links });
      } else {
        throw new Error(result.error || 'Nenhuma sugestão encontrada.');
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Erro ao sugerir links: ${error.message}`);
    } finally {
      setIsSuggestingLinks(false);
    }
  }, [draft, onUpdateDraft]);

  const removeInternalLink = (index: number) => {
    const updatedLinks = (draft.internal_links || []).filter((_, i) => i !== index);
    onUpdateDraft({ ...draft, internal_links: updatedLinks });
  };

  if (!isOpen) return null

  return (
    <div className="w-full lg:w-96 bg-gray-50 border-l flex flex-col lg:flex-shrink-0">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-lg flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Configurações
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4']} className="w-full">
          
          {/* Metadados & SEO */}
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-semibold">Metadados & SEO</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título (H1) *</Label>
                <Input id="title" value={draft.title || ''} onChange={(e) => onUpdateDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input id="slug" value={draft.slug || ''} onChange={(e) => onUpdateDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Descrição *</Label>
                <Textarea id="meta_description" value={draft.meta_description || ''} onChange={(e) => onUpdateDraft({ ...draft, meta_description: e.target.value.substring(0, 160) })} rows={3} />
                <p className="text-xs text-gray-500 text-right">{draft.meta_description?.length || 0} / 160</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Organização */}
          <AccordionItem value="item-2">
            <AccordionTrigger className="font-semibold">Organização</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={draft.category_id || ''} onValueChange={(value) => onUpdateDraft({ ...draft, category_id: value })}>
                  <SelectTrigger id="category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Palavras-chave Secundárias</Label>
                <Input id="keywords" value={(draft.secondary_keywords || []).join(', ')} onChange={(e) => onUpdateDraft({ ...draft, secondary_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })} />
              </div>
              <div className="space-y-2 border-t pt-4">
                <Label>Links Internos</Label>
                <div className="space-y-2">
                  {(draft.internal_links || []).map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 truncate hover:underline">
                        <LinkIcon className="w-3 h-3 mr-1 inline" />
                        {link.title}
                      </a>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeInternalLink(index)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSuggestInternalLinks} variant="outline" className="w-full" disabled={isSuggestingLinks}>
                  {isSuggestingLinks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                  Sugerir Links Internos (IA)
                </Button>
              </div>
              <div className="space-y-2 border-t pt-4">
                <Label>Sugestões de Links Externos (IA)</Label>
                <div className="space-y-2">
                  {(draft.external_links || []).map((link, index) => (
                    <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs font-semibold text-blue-800">{link.title}</p>
                      <p className="text-xs text-blue-600 mt-1">{(link as any).reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Imagem de Destaque */}
          <AccordionItem value="item-3">
            <AccordionTrigger className="font-semibold">Imagem de Destaque</AccordionTrigger>
            <AccordionContent className="pt-2">
              <OptimizedImageUpload
                value={draft.featured_image_url || ''}
                altText={draft.image_alt_text || ''}
                imagePrompt={draft.image_prompt || ''}
                onImageChange={(url) => onUpdateDraft({ ...draft, featured_image_url: url })}
                onAltTextChange={(alt) => onUpdateDraft({ ...draft, image_alt_text: alt })}
                onPromptChange={(prompt) => onUpdateDraft({ ...draft, image_prompt: prompt })}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Análise de SEO */}
          <AccordionItem value="item-4">
            <AccordionTrigger className="font-semibold">Análise de SEO</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="p-4 bg-white rounded-lg border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">SEO Score:</span>
                  <span className={`text-xl font-bold ${getSeoColor(seoAnalysis.seoScore)}`}>{seoAnalysis.seoScore}%</span>
                </div>
                <div className="flex justify-between text-sm"><span className="font-medium">Palavras:</span><span>{seoAnalysis.wordCount}</span></div>
                <div className="flex justify-between text-sm"><span className="font-medium">Densidade:</span><span>{seoAnalysis.keywordDensity}%</span></div>
                <div className="flex justify-between text-sm"><span className="font-medium">Legibilidade:</span><span>{seoAnalysis.readabilityScore}</span></div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-base font-semibold text-red-800 mb-2">Problemas ({seoAnalysis.issues.length})</h4>
                {seoAnalysis.issues.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {seoAnalysis.issues.map((issue, index) => <li key={index}>{issue}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-green-700 flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Nenhum problema crítico.</p>
                )}
              </div>
              <Button onClick={onGenerateWithAI} variant="outline" className="w-full text-purple-600 border-purple-600 hover:bg-purple-50">
                <RefreshCw className="w-4 h-4 mr-1" /> Reanalisar com IA
              </Button>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  )
}

export default Sidebar