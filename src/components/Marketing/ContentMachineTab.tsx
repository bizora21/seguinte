import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Zap, Search, Send, Loader2, ArrowRight, FileText } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { AIGeneratedContent } from '../../types/blog'
import { useNavigate } from 'react-router-dom'

const ContentMachineTab = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null)
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleGenerateContent = async () => {
    if (!keyword.trim()) {
      showError('Por favor, insira uma palavra-chave principal.')
      return
    }

    setLoading(true)
    setGeneratedContent(null)
    const toastId = showLoading('Gerando artigo completo por IA...')

    try {
      // 1. Chamar a Edge Function para simular a geração de conteúdo
      const { data, error } = await supabase.functions.invoke(`content-generator?keyword=${encodeURIComponent(keyword.trim())}`, {
        method: 'GET',
      })

      if (error) throw error
      
      const content = data.data as AIGeneratedContent
      
      // 2. Encontrar o ID da categoria sugerida
      const suggestedCategory = categories.find(c => c.name === content.suggested_category)
      
      if (!suggestedCategory) {
          showError(`A categoria sugerida pela IA (${content.suggested_category}) não existe.`)
          // Continuar mesmo assim, mas sem category_id
      }

      // 3. Armazenar o conteúdo gerado no localStorage para ser pego pelo ManageBlogPost
      localStorage.setItem('ai_generated_post', JSON.stringify({
          ...content,
          category_id: suggestedCategory?.id || ''
      }))

      dismissToast(toastId)
      showSuccess('Artigo gerado com sucesso! Redirecionando para revisão.')
      
      // 4. Redirecionar para a página de criação/edição
      navigate('/dashboard/admin/blog/new?source=ai')

    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error generating content:', error)
      showError('Falha na geração de conteúdo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Zap className="w-6 h-6 mr-2 text-yellow-600" />
          Máquina de Produção de Conteúdo (IA)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Gere um artigo completo e otimizado para SEO a partir de uma única palavra-chave.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="keyword" className="font-medium">
            Palavra-chave Principal (Ex: "vender eletrônicos em moçambique")
          </Label>
          <div className="flex space-x-2">
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Insira a palavra-chave principal"
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleGenerateContent} 
              disabled={loading || !keyword.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Gerar Artigo Completo
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-semibold text-blue-800 mb-1 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Próximo Passo
            </p>
            <p className="text-blue-700">
                Após a geração, você será redirecionado para o editor, onde poderá revisar o conteúdo, gerar a imagem de destaque e publicar.
            </p>
        </div>
        
        {/* Botão de Acesso Rápido ao Editor Manual */}
        <Button 
            onClick={() => navigate('/dashboard/admin/blog/new')}
            variant="outline"
            className="w-full"
        >
            <ArrowRight className="w-4 h-4 mr-2" />
            Acessar Editor Manual
        </Button>
      </CardContent>
    </Card>
  )
}

export default ContentMachineTab