import { useState, useEffect, useCallback } from 'react'
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
  Target, // Adicionado
  TrendingUp,
  MapPin,
  Zap,
  ArrowRight // Adicionado
} from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { BlogCategory, AIGeneratedContent } from '../../types/blog'
import OptimizedImageUpload from './OptimizedImageUpload'

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

  const generateLocalizedPrompt = () => {
    const audienceMap = {
      'vendedores': 'vendedores e empreendedores',
      'clientes': 'consumidores e compradores online',
      'geral': 'público geral interessado em e-commerce'
    }

    const typeMap = {
      'guia-completo': 'um guia completo e detalhado',
      'dicas-praticas': 'dicas práticas e acionáveis',
      'caso-estudo': 'um estudo de caso real',
      'tendencias': 'análise de tendências e oportunidades'
    }

    const contextMap = {
      'maputo': 'Maputo e região metropolitana',
      'beira': 'Beira e província de Sofala',
      'nampula': 'Nampula e região norte',
      'nacional': 'todo território moçambicano'
    }

    return `
Você é um especialista em e-commerce e marketing digital em Moçambique. Escreva ${typeMap[contentType]} sobre "${keyword}" direcionado para ${audienceMap[targetAudience]} em ${contextMap[localContext]}.

CONTEXTO MOÇAMBICANO OBRIGATÓRIO:
- Use exemplos específicos de cidades moçambicanas (Maputo, Matola, Beira, Nampula, etc.)
- Mencione a moeda local (Metical - MZN) em exemplos de preços
- Referencie desafios e oportunidades específicas do mercado moçambicano
- Inclua referências culturais e econômicas relevantes
- Mencione métodos de pagamento populares (M-Pesa, eMola, pagamento na entrega)
- Considere a infraestrutura de internet e logística local

OTIMIZAÇÃO PARA GOOGLE DISCOVER:
- Título atrativo que desperte curiosidade sem ser clickbait
- Conteúdo atual e relevante para 2024-2025
- Informação prática e acionável
- Estrutura clara com subtítulos
- Linguagem acessível mas profissional

ESTRUTURA OBRIGATÓRIA:
1. Introdução envolvente (contexto moçambicano)
2. 3-5 seções principais com subtítulos
3. Exemplos práticos locais
4. Conclusão com call-to-action para a LojaRápida
5. Mínimo 1500 palavras para autoridade SEO

Palavra-chave principal: "${keyword}"
Público-alvo: ${audienceMap[targetAudience]}
Localização: ${contextMap[localContext]}
`
  }

  const handleGenerateContent = async () => {
    if (!keyword.trim()) {
      showError('Por favor, insira uma palavra-chave principal.')
      return
    }

    setLoading(true)
    setPreviewContent(null)
    const toastId = showLoading('Gerando conteúdo hiper-localizado para Moçambique...')

    try {
      // Gerar prompt localizado
      const localizedPrompt = generateLocalizedPrompt()
      
      // Chamar Edge Function com prompt melhorado
      const { data, error } = await supabase.functions.invoke(`content-generator?keyword=${encodeURIComponent(keyword.trim())}&context=${localContext}&audience=${targetAudience}&type=${contentType}`, {
        method: 'POST',
        body: { prompt: localizedPrompt }
      })

      if (error) throw error
      
      const content = data.data as AIGeneratedContent
      
      // Encontrar categoria sugerida
      const suggestedCategory = categories.find(c => 
        c.name.toLowerCase().includes(content.suggested_category.toLowerCase()) ||
        content.suggested_category.toLowerCase().includes(c.name.toLowerCase())
      )

      // Gerar prompt de imagem localizado
      const localizedImagePrompt = `${content.image_prompt}, cenário moçambicano, ${contextMap[localContext]}, estilo profissional e vibrante, alta qualidade`
      
      setPreviewContent(content)
      setImagePrompt(localizedImagePrompt)
      
      dismissToast(toastId)
      showSuccess('Conteúdo hiper-localizado gerado com sucesso!')
      
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
            Hub de Conteúdo Avançado e Localizado
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
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <FileText className="w-6 h-6 mr-2" />
              Preview do Conteúdo Gerado
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título Gerado</Label>
                <div className="p-3 bg-white rounded border">
                  <p className="font-semibold">{previewContent.title}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria Sugerida</Label>
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm">{previewContent.suggested_category}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meta Descrição</Label>
              <div className="p-3 bg-white rounded border">
                <p className="text-sm text-gray-700">{previewContent.meta_description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Palavras-chave Secundárias</Label>
              <div className="p-3 bg-white rounded border">
                <div className="flex flex-wrap gap-2">
                  {previewContent.secondary_keywords.map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Gestão de Imagem Híbrida */}
            <OptimizedImageUpload
              value={imageUrl}
              altText={imageAltText}
              imagePrompt={imagePrompt}
              onImageChange={setImageUrl}
              onAltTextChange={setImageAltText}
              onPromptChange={setImagePrompt}
            />

            <div className="space-y-2">
              <Label>Preview do Conteúdo (Primeiros 300 caracteres)</Label>
              <div className="p-4 bg-white rounded border max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-700">
                  {previewContent.content.substring(0, 300)}...
                </p>
              </div>
            </div>

            {/* Métricas de Qualidade */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{previewContent.seo_score}%</div>
                <div className="text-xs text-gray-600">SEO Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{previewContent.readability_score}</div>
                <div className="text-xs text-gray-600">Legibilidade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{previewContent.external_links.length}</div>
                <div className="text-xs text-gray-600">Links Externos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{previewContent.internal_links.length}</div>
                <div className="text-xs text-gray-600">Links Internos</div>
              </div>
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
      )}

      {/* Instruções de Uso */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <Search className="w-5 h-5 mr-2" />
            Como Usar o Hub de Conteúdo
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
            <p>Gere o conteúdo e escolha entre imagem IA ou upload manual</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold">4.</span>
            <p>Revise o preview e finalize no editor para publicação</p>
          </div>
        </CardContent>
      </Card>

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