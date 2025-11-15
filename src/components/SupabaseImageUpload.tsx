import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface SupabaseImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  bucket: string
  folder?: string
  maxImages?: number
  maxSizeMB?: number
}

const SupabaseImageUpload = ({ 
  value = [], 
  onChange, 
  bucket,
  folder = '',
  maxImages = 2, 
  maxSizeMB = 2,
}: SupabaseImageUploadProps) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const defaultImage = '/placeholder.svg'

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) {
      showError("Você precisa estar logado para fazer upload.")
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`
    // CORREÇÃO: Garante que o folder é usado como prefixo, mas sem barras extras
    const filePath = folder ? `${folder}/${fileName}` : fileName

    const toastId = showLoading('Enviando imagem...')
    setUploading(true)

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      dismissToast(toastId)
      return data.publicUrl
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Erro no upload para o Supabase:', error)
      showError('Erro ao fazer upload da imagem: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (value.length >= maxImages) {
      showError(`Máximo de ${maxImages} imagens permitido.`)
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    const url = await uploadImage(file)
    if (url) {
      onChange([...value, url])
      showSuccess('Imagem adicionada com sucesso!')
    }
  }, [value, onChange, maxImages, bucket, folder])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: 1,
    disabled: uploading || value.length >= maxImages,
  })

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {value.map((url, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = defaultImage }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {value.length < maxImages && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div
                {...getRootProps()}
                className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed ${
                  isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
                } rounded-lg`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Enviando...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Clique ou arraste a imagem
                    </p>
                    <p className="text-xs text-gray-500">
                      Max: {maxSizeMB}MB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default SupabaseImageUpload