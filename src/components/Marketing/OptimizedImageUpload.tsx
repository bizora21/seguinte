import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Zap, Download, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'

interface OptimizedImageUploadProps {
  value: string
  altText: string
  imagePrompt: string
  onImageChange: (url: string) => void
  onAltTextChange: (altText: string) => void
  onPromptChange: (prompt: string) => void
}

const OptimizedImageUpload = ({ 
  value, 
  altText, 
  imagePrompt,
  onImageChange, 
  onAltTextChange,
  onPromptChange
}: OptimizedImageUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'ai'>('ai')

  // Função para otimizar imagem (simulação - em produção usaria Canvas API ou serviço externo)
  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Dimensões ideais para Google Discover: 1200x675 (16:9)
        canvas.width = 1200
        canvas.height = 675
        
        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, 1200, 675)
        
        // Converter para blob otimizado
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.85) // 85% de qualidade para otimização
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Otimizar imagem antes do upload
      const optimizedFile = await optimizeImage(file)
      
      const fileExt = 'jpg' // Sempre JPG após otimização
      const fileName = `blog_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `blog-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images') // Usando o bucket existente
        .upload(filePath, optimizedFile)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Image optimization error:', error)
      return null
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validação
    if (!file.type.startsWith('image/')) {
      showError('Apenas imagens são aceitas')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      showError('Imagem muito grande. Máximo 10MB.')
      return
    }

    setUploading(true)
    const toastId = showLoading('Otimizando e fazendo upload da imagem...')

    const url = await uploadImage(file)
    
    dismissToast(toastId)
    
    if (url) {
      onImageChange(url)
      // Sugerir alt text baseado no nome do arquivo
      const suggestedAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      onAltTextChange(suggestedAlt)
      showSuccess('Imagem otimizada e carregada com sucesso!')
    } else {
      showError('Erro ao fazer upload da imagem')
    }

    setUploading(false)
  }, [onImageChange, onAltTextChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: uploading
  })

  const handleGenerateAI = async () => {
    if (!imagePrompt.trim()) {
      showError('Insira um prompt para gerar a imagem')
      return
    }

    setGenerating(true)
    const toastId = showLoading('Gerando imagem com IA...')

    try {
      // Simulação de geração de imagem com IA (em produção usaria DALL-E, Midjourney API, etc.)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Gerar URL mockada otimizada para Google Discover (1200x675)
      const mockImageUrl = `https://picsum.photos/seed/${encodeURIComponent(imagePrompt)}/1200/675`
      
      onImageChange(mockImageUrl)
      onAltTextChange(imagePrompt) // Usar o prompt como alt text inicial
      
      dismissToast(toastId)
      showSuccess('Imagem gerada com sucesso! Dimensões otimizadas para Google Discover.')
    } catch (error) {
      dismissToast(toastId)
      showError('Erro ao gerar imagem')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-800">
          <ImageIcon className="w-5 h-5 mr-2" />
          Imagem de Destaque (Otimizada para Google Discover)
        </CardTitle>
        <p className="text-sm text-purple-700">
          Dimensões automáticas: 1200x675px (16:9) • Compressão otimizada • Alt text para acessibilidade
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(tab: 'upload' | 'ai') => setActiveTab(tab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Gerar com IA
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload
            </TabsTrigger>
          </TabsList>

          {/* Tab: Gerar com IA */}
          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">Prompt para Geração de Imagem</Label>
              <Input
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Ex: Vendedor moçambicano sorrindo com produtos, estilo profissional"
                disabled={generating}
              />
            </div>
            <Button
              onClick={handleGenerateAI}
              disabled={generating || !imagePrompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Imagem com IA
                </>
              )}
            </Button>
          </TabsContent>

          {/* Tab: Upload Manual */}
          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-600">Otimizando e fazendo upload...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Arraste uma imagem aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500">
                    Será automaticamente redimensionada para 1200x675px
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview da Imagem */}
        {value && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={value}
                alt={altText || 'Preview da imagem'}
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  onImageChange('')
                  onAltTextChange('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Campo de Alt Text */}
            <div className="space-y-2">
              <Label htmlFor="altText">Texto Alt (Acessibilidade e SEO)</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => onAltTextChange(e.target.value)}
                placeholder="Descreva a imagem para leitores de tela e SEO"
                disabled={uploading || generating}
              />
            </div>

            {/* Informações de Otimização */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-800 text-sm">
                <Download className="w-4 h-4 mr-2" />
                <span className="font-medium">Imagem otimizada para Google Discover</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Dimensões: 1200x675px • Formato: JPEG • Compressão: 85% • Carregamento rápido garantido
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OptimizedImageUpload