import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Separator } from '../../ui/separator'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { 
  FileText, Lightbulb, Search, 
  BarChart3, CheckCircle, AlertTriangle,
  Plus, Trash2, X
} from 'lucide-react'
import { ContentDraft, BlogCategory } from '../../../types/blog'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  draft: ContentDraft
  categories: BlogCategory[]
  onGenerateWithAI: (prompt: string) => void
  wordCount: number // Adicionado
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, draft, categories, onGenerateWithAI, wordCount }) => {
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'toc' | 'seo'>('seo')

  // Gerar TOC (Table of Contents) a partir do conteúdo
  const toc = useMemo(() => {
    if (!draft.content) return []

    const parser = new DOMParser()
    // Usamos o conteúdo HTML (string) para simular a análise do TipTap
    const doc = parser.parseFromString(draft.content, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4')
    
    return Array.from(headings).map((heading, index) => ({
      id: heading.id || `heading-${index}`,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.substring(1)),
    }))
  }, [draft.content])

  // Analisar SEO
  const seoAnalysis = useMemo(() => {
    // Usamos a contagem de palavras passada como prop
    
    const contentText = draft.content?.replace(/<[^>]*>/g, ' ') || '' // Remove HTML tags
    
    const keyword = draft.keyword || ''
    const keywordCount = keyword 
      ? (contentText.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      : 0
      
    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount * 100).toFixed(2) : '0.00'
    
    const issues: string[] = []
    if (wordCount < 1200) issues.push(`Comprimento: O artigo deve ter no mínimo 1200 palavras (Atual: ${wordCount}).`)
    if (parseFloat(keywordDensity) < 0.5 || parseFloat(keywordDensity) > 2.0) issues.push(`Densidade da Palavra-chave: Ideal entre 0.5% e 2.0% (Atual: ${keywordDensity}%).`)
    if (!draft.meta_description || draft.meta_description.length < 50) issues.push('Meta Descrição: Muito curta ou ausente.')
    if (!draft.slug) issues.push('Slug: O slug (URL) não está definido.')
    if (!draft.featured_image_url) issues.push('Imagem de Destaque: Ausente.')
    if (!draft.category_id) issues.push('Categoria: Ausente.')

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

  if (!isOpen) return null

  return (
    <div className="w-80 bg-white border-l flex flex-col flex-shrink-0">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-lg flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
          Ferramentas
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Tabs de Navegação */}
        <div className="flex space-x-2 mb-4 border-b pb-2">
          <Button 
            variant={activeTab === 'seo' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('seo')}
            className="flex-1"
          >
            <BarChart3 className="w-4 h-4 mr-1" /> SEO
          </Button>
          <Button 
            variant={activeTab === 'toc' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('toc')}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-1" /> Estrutura
          </Button>
        </div>

        {/* Conteúdo da Aba SEO */}
        {activeTab === 'seo' && seoAnalysis && (
          <div className="space-y-4">
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">SEO Score:</span>
                  <span className={`text-xl font-bold ${getSeoColor(seoAnalysis.seoScore)}`}>
                    {seoAnalysis.seoScore}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Palavras:</span>
                  <span>{seoAnalysis.wordCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Densidade ({draft.keyword || 'N/A'}):</span>
                  <span>{seoAnalysis.keywordDensity}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Legibilidade:</span>
                  <span>{seoAnalysis.readabilityScore}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex items-center text-red-800">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Problemas ({seoAnalysis.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {seoAnalysis.issues.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {seoAnalysis.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-700 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Nenhum problema crítico encontrado.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Separator />
            
            <h3 className="text-sm font-semibold mb-2">Sugestões de IA</h3>
            <p className="text-xs text-gray-600">
              Use a IA para gerar parágrafos, títulos ou expandir seções.
            </p>
            <Button 
              onClick={() => onGenerateWithAI('expandir')} 
              variant="outline" 
              className="w-full text-purple-600 border-purple-600 hover:bg-purple-50"
              disabled={isGenerating}
            >
              <Plus className="w-4 h-4 mr-1" />
              {isGenerating ? 'Gerando...' : 'Gerar Próxima Seção'}
            </Button>
          </div>
        )}

        {/* Conteúdo da Aba Estrutura (TOC) */}
        {activeTab === 'toc' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold mb-2">Navegação de Estrutura</h3>
            {toc.length === 0 ? (
              <p className="text-sm text-gray-500">Comece a adicionar títulos (H1, H2, H3) para ver a estrutura.</p>
            ) : (
              <div className="space-y-1">
                {toc.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      // Lógica para rolar até o elemento (requer IDs no editor)
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className={`cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors text-sm truncate ${
                      item.level === 1 ? 'font-bold text-lg' : 
                      item.level === 2 ? 'ml-2 font-semibold' : 
                      'ml-4 text-gray-600'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar