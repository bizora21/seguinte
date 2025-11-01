import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Globe, 
  Send, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Plus,
  BarChart3,
  FileText,
  Copy,
  Loader2,
  ArrowUp,
  ArrowDown,
  Tag,
  Settings,
  Target,
  TrendingUp,
  MapPin,
  Zap,
  ArrowRight,
  MessageSquare,
  Lightbulb
} from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { BlogCategory, AIGeneratedContent } from '../../types/blog'
import OptimizedImageUpload from './OptimizedImageUpload'

interface SeoSuggestion {
  id: number
  suggestion: string
}

const ContentMachineTab = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [targetAudience, setTargetAudience] = useState('vendedores')
  const [contentType, setContentType] = useState('guia-completo')
  const [localContext, setLocalContext] = useState('maputo')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  
  // Estados para preview do conteúdo gerado
  const [previewContent, setPreviewContent] = useState<AIGeneratedContent | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAltText, setImageAltText] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  
  // Estados do SEO Coach
  const [seoSuggestions, setSeoSuggestions] = useState<SeoSuggestion[]>([])
  const [seoLoading, setSeoLoading] = useState(false)
  
  // Estados de Sugestões Proativas
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([
    '5 Erros Comuns a Evitar',
    'Perguntas para Enquete de Engajamento',
    'Checklist de Lançamento de Produto'
  ])
  const [generatingProactive, setGeneratingProactive] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug, created_at')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // --- Lógica do SEO Coach em Tempo Real (Debounced) ---
  const fetchSeoSuggestions = useCallback(async (content: string, currentKeyword: string) => {
    if (!content || !currentKeyword || content.length < 500) {
      setSeoSuggestions([])
      return
    }
    
    setSeoLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('seo-coach', {
        method: 'POST',
        body: { keyword: currentKeyword, content: content }
      })
      
      if (error) throw error
      
      setSeoSuggestions(data.data.suggestions || [])
    } catch (error) {
      console.error('Error fetching SEO suggestions:', error)
      setSeoSuggestions([{ id: 99, suggestion: 'Erro ao carregar sugestões de SEO.' }])
    } finally {
      setSeoLoading(false)
    }
  }, [])
  
  // Debounce para o SEO Coach
  useEffect(() => {
    const handler = setTimeout(() => {
      if (previewContent?.content) {
        fetchSeoSuggestions(previewContent.content, keyword)
      }
    }, 1500) // 1.5 segundos de debounce

    return () => {
      clearTimeout(handler)
    }
  }, [previewContent?.content, keyword, fetchSeoSuggestions])
  // --- Fim da Lógica do SEO Coach ---

  const handleGenerateContent = async () => {
    if (!keyword.trim()) {
      showError('Por favor, insira uma palavra-chave principal.')
      return
    }

    setLoading(true)
    setPreviewContent(null)
    const toastId = showLoading('Gerando conteúdo hiper-localizado para Moçambique...')

    try {
      // Chamar Edge Function para gerar artigo e prompt de imagem
      const { data, error } = await supabase.functions.invoke(`content-generator?keyword=${encodeURIComponent(keyword.trim())}&context=${localContext}&audience=${targetAudience}&type=${contentType}`, {
        method: 'POST',
        body: {} // O prompt é gerado dentro da Edge Function
      })

      if (error) throw error
      
      const content = data.data as AIGeneratedContent & { image_prompt: string }
      
      setPreviewContent(content)
      setImagePrompt(content.image_prompt)
      
      dismissToast(toastId)
      showSuccess('Conteúdo e prompt de imagem gerados com sucesso! Revise abaixo.')
      
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error generating content:', error)
      showError('Falha na geração de conteúdo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndEdit = () => {
    if (!previewContent) return

    // Encontrar categoria
    const suggestedCategory = categories.find(c => 
      c.name.toLowerCase().includes(previewContent.suggested_category.toLowerCase())
    )

    // Preparar dados completos para o editor
    const completeContent = {
      ...previewContent,
      category_id: suggestedCategory?.id || '',
      featured_image_url: imageUrl,
      image_alt_text: imageAltText,
      image_prompt: imagePrompt
    }

    // Salvar no localStorage
    localStorage.setItem('ai_generated_post', JSON.stringify(completeContent))
    
    // Redirecionar para o editor
    navigate('/dashboard/admin/blog/new?source=ai')
  }
  
  const handleProactiveSuggestion = async (suggestion: string) => {
    if (!previewContent) return
    
    setGeneratingProactive(true)
    const toastId = showLoading(`Gerando seção: ${suggestion}...`)
    
    try {
      // Prompt para gerar a nova seção
      const proactivePrompt = `Com base no artigo principal sobre '${keyword}' (que começa com: ${previewContent.content.substring(0, 500)}...), gere uma nova seção completa e formatada em Markdown sobre '${suggestion}'. Retorne apenas o conteúdo Markdown da nova seção, sem título H1 ou JSON.`
      
      // Simulação de chamada à GLM para gerar a nova seção
      // const { data, error } = await supabase.functions.invoke('content-generator', { method: 'POST', body: { prompt: proactivePrompt, action: 'proactive_section' } })
      
      // MOCK DE CONTEÚDO PROATIVO
      const newSectionContent = `
## 5 Erros Comuns a Evitar ao Vender ${keyword}

1.  **Ignorar o WhatsApp:** O WhatsApp é o principal canal de comunicação em Moçambique. Use-o para suporte e vendas.
2.  **Fotos de Baixa Qualidade:** Fotos ruins matam a confiança. Invista em boas imagens.
3.  **Não Usar Pagamento na Entrega:** Sem COD, você perde a maioria dos clientes.
4.  **Logística Lenta:** Atrasos na entrega geram cancelamentos. Use parceiros confiáveis.
`;
      // FIM DO MOCK
      
      // Adicionar a nova seção ao conteúdo existente
      setPreviewContent(prev => ({
        ...prev!,
        content: `${prev!.content}\n\n${newSectionContent}`
      }))
      
      dismissToast(toastId)
      showSuccess(`Seção '${suggestion}' adicionada ao artigo!`)
      
    } catch (error: any) {
      dismissToast(toastId)
      showError('Falha ao gerar sugestão proativa.')
    } finally {
      setGeneratingProactive(false)
    }
  }

  const contextMap: Record<string, string> = {
    'maputo': 'Maputo e região metropolitana',
    'beira': 'Beira e província de Sofala', 
    'nampula': 'Nampula e região norte',
    'nacional': 'todo território moçambicano'
  }

  return (
    <div className="space-y-6">
      {/* Configuração de Geração */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Target className="w-6 h-6 mr-2" />
            Motor de Conteúdo Nível Profissional
          </CardTitle>
          <p className="text-sm text-green-700">
            Gere conteúdo otimizado para SEO local, Google Discover e o mercado moçambicano
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Palavra-chave Principal *</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ex: vender eletrônicos online"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Público-Alvo</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedores">Vendedores e Empreendedores</SelectItem>
                  <SelectItem value="clientes">Consumidores e Compradores</SelectItem>
                  <SelectItem value="geral">Público Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Tipo de Conteúdo</Label>
              <Select value={contentType} onValueChange={setContentType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guia-completo">Guia Completo</SelectItem>
                  <SelectItem value="dicas-praticas">Dicas Práticas</SelectItem>
                  <SelectItem value="caso-estudo">Caso de Estudo</SelectItem>
                  <SelectItem value="tendencias">Análise de Tendências</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="localContext">Contexto Local</Label>
              <Select value={localContext} onValueChange={setLocalContext} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maputo">
                    <MapPin className="w-4 h-4 mr-2 inline" />
                    Maputo e Região
                  </SelectItem>
                  <SelectItem value="beira">
                    <MapPin className="w-4 h-4 mr-2 inline" />
                    Beira e Sofala
                  </SelectItem>
                  <SelectItem value="nampula">
                    <MapPin className="w-4 h-4 mr-2 inline" />
                    Nampula e Norte
                  </SelectItem>
                  <SelectItem value="nacional">
                    <Globe className="w-4 h-4 mr-2 inline" />
                    Nacional (Todo MZ)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerateContent} 
            disabled={loading || !keyword.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando Conteúdo Localizado...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Gerar Artigo Hiper-Localizado
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview do Conteúdo Gerado */}
      {previewContent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Preview e Edição Rápida */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <FileText className="w-6 h-6 mr-2" />
                  Preview e Edição Rápida
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    SEO Score: <span className="font-bold text-green-600 ml-1">{previewContent.seo_score}%</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    Localização: <span className="font-bold text-blue-600 ml-1">{contextMap[localContext]}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título Gerado</Label>
                  <Input value={previewContent.title} readOnly className="font-semibold" />
                </div>
                
                <div className="space-y-2">
                  <Label>Conteúdo (Edição Rápida)</Label>
                  <Textarea
                    value={previewContent.content}
                    onChange={(e) => setPreviewContent(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={10}
                    placeholder="Edite o Markdown aqui..."
                    className="font-mono text-sm"
                  />
                </div>
                
                <Button 
                  onClick={handleSaveAndEdit}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Finalizar no Editor Avançado
                </Button>
              </CardContent>
            </Card>
            
            {/* Sugestões Proativas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                  <Lightbulb className="w-6 h-6 mr-2" />
                  Sugestões Proativas da IA
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Clique para gerar e adicionar novas seções ao seu artigo.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {proactiveSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleProactiveSuggestion(suggestion)}
                    disabled={generatingProactive || loading}
                    className="flex items-center"
                  >
                    {generatingProactive ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    {suggestion}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
          
          {/* Coluna Lateral: Otimização e SEO Coach */}
          <div className="lg:col-span-1 space-y-6">
            {/* SEO Coach */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-yellow-800">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Coach de SEO em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                {seoLoading ? (
                  <div className="flex justify-center h-16"><LoadingSpinner size="sm" /></div>
                ) : seoSuggestions.length > 0 && seoSuggestions[0].id !== 99 ? (
                  <ul className="space-y-3">
                    {seoSuggestions.map((s) => (
                      <li key={s.id} className="flex items-start text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                        {s.suggestion}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    {seoSuggestions[0]?.suggestion || 'Comece a editar o conteúdo para receber sugestões de otimização.'}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Gestão de Imagem Híbrida */}
            <OptimizedImageUpload
              value={imageUrl}
              altText={imageAltText}
              imagePrompt={imagePrompt}
              onImageChange={setImageUrl}
              onAltTextChange={setImageAltText}
              onPromptChange={setImagePrompt}
            />
            
            {/* Métricas de Qualidade */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Métricas de Qualidade
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{previewContent.seo_score}%</div>
                  <div className="text-xs text-gray-600">SEO Score</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{previewContent.readability_score}</div>
                  <div className="text-xs text-gray-600">Legibilidade</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{previewContent.external_links.length}</div>
                  <div className="text-xs text-gray-600">Links Externos</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{previewContent.internal_links.length}</div>
                  <div className="text-xs text-gray-600">Links Internos</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Instruções de Uso */}
      {!previewContent && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Search className="w-5 h-5 mr-2" />
              Como Usar o Motor de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-yellow-700">
            <div className="flex items-start space-x-2">
              <span className="font-bold">1.</span>
              <p>Insira uma palavra-chave relevante para o mercado moçambicano</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold">2.</span>
              <p>Selecione o público-alvo e o contexto geográfico específico</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold">3.</span>
              <p>Gere o conteúdo e o prompt de imagem em uma única chamada</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold">4.</span>
              <p>Use o Coach de SEO em tempo real para refinar o artigo antes de publicar.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Acesso Rápido ao Editor Manual */}
      <Button 
        onClick={() => navigate('/dashboard/admin/blog/new')}
        variant="outline"
        className="w-full"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        Acessar Editor Manual (Sem IA)
      </Button>
    </div>
  )
}

export default ContentMachineTab