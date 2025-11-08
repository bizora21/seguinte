import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Zap, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { Skeleton } from '../ui/skeleton'

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
  const [activeTab, setActiveTab] = useState<'ai' | 'upload'>('ai')
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  useEffect(() => {
    if (value) {
      setImageStatus('loading');
    } else {
      setImageStatus('idle');
    }
  }, [value]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary Cloud Name ou Upload Preset não estão configurados.")
      showError("Configuração do Cloudinary incompleta.")
      return null
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'blog-images') // Pasta específica para o blog

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Falha no upload da imagem.')
      }

      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Erro no upload para o Cloudinary:', error)
      showError('Erro ao fazer upload da imagem.')
      return null
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    if (!file.type.startsWith('image/')) {
      showError('Apenas imagens são aceitas')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      showError('Imagem muito grande. Máximo 10MB.')
      return
    }

    setUploading(true)
    const toastId = showLoading('Fazendo upload da imagem...')

    const url = await uploadImage(file)
    
    dismissToast(toastId)
    
    if (url) {
      onImageChange(url)
      const suggestedAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      onAltTextChange(suggestedAlt)
      showSuccess('Imagem carregada com sucesso!')
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
    const toastId = showLoading('Buscando imagem no Unsplash...')

    try {
      const response = await supabase.functions.invoke('unsplash-image-generator', {
        method: 'POST',
        body: { prompt: imagePrompt.trim() }
      })
      
      if (response.error) throw response.error
      
      const result = response.data as { success: boolean, imageUrl: string, imageAlt: string }
      
      if (!result.success || !result.imageUrl) {
        throw new Error('Nenhuma imagem relevante encontrada no Unsplash.')
      }
      
      onImageChange(result.imageUrl)
      onAltTextChange(result.imageAlt)
      
      dismissToast(toastId)
      showSuccess('Imagem do Unsplash carregada com sucesso!')
      
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error generating image:', error)
      showError(`Falha ao buscar imagem: ${error.message || 'Erro de conexão.'}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-800">
          <ImageIcon className="w-5 h-5 mr-2" />
          Imagem de Destaque (1200x675px)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(tab: 'upload' | 'ai') => setActiveTab(tab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Buscar no Unsplash
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">Prompt de Busca (Ex: "vendedor moçambicano", "e-commerce")</Label>
              <Input
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Insira o tema da imagem"
                disabled={generating}
              />
            </div>
            <Button
              onClick={handleGenerateAI}
              disabled={generating || !imagePrompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Buscar Imagem</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="space-y-2"><Loader2 className="w-8 h-8 mx-auto animate-spin" /><p>Enviando...</p></div>
              ) : (
                <div className="space-y-2"><Upload className="w-8 h-8 text-gray-400 mx-auto" /><p>Arraste ou clique para enviar</p></div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {value && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full">
              {imageStatus === 'loading' && <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />}
              {imageStatus === 'error' && (
                <div className="absolute inset-0 w-full h-full rounded-lg border-2 border-dashed border-red-400 bg-red-50 flex flex-col items-center justify-center text-red-600">
                  <AlertTriangle className="w-8 h-8 mb-2" />
                  <p className="font-semibold">Falha ao carregar imagem</p>
                </div>
              )}
              <img
                src={value}
                alt={altText || 'Preview da imagem'}
                className={`w-full h-full object-cover rounded-lg border transition-opacity duration-300 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageStatus('loaded')}
                onError={() => setImageStatus('error')}
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 z-10"
                onClick={() => onImageChange('')}
              >
                <X className="h-4 h-4" />
              </Button>
            </div>
            
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OptimizedImageUpload