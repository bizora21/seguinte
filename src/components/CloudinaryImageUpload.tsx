import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { showSuccess, showError } from '../utils/toast'

interface CloudinaryImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  maxSizeMB?: number
  folder?: string
}

const CloudinaryImageUpload = ({ 
  value = [], 
  onChange, 
  maxImages = 2, 
  maxSizeMB = 2,
  folder = 'products'
}: CloudinaryImageUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const defaultImage = '/placeholder.svg'

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary Cloud Name ou Upload Preset não estão configurados.")
      showError("Configuração do Cloudinary incompleta.")
      return null
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', folder)

    try {
      setUploading(true)
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
  }, [value, onChange, maxImages])

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

export default CloudinaryImageUpload