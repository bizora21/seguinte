import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../utils/toast'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  maxSizeMB?: number
}

const ImageUpload = ({ 
  value = [], 
  onChange, 
  maxImages = 2, 
  maxSizeMB = 1 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const defaultImage = '/placeholder.svg' // CORRIGIDO: Usando placeholder local

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (value.length >= maxImages) {
      showError(`Máximo de ${maxImages} imagens permitido`)
      return
    }

    // Validação dos arquivos
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of acceptedFiles) {
      // Verificar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} não é uma imagem válida`)
        continue
      }

      // Verificar tamanho
      if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(`${file.name} é maior que ${maxSizeMB}MB`)
        continue
      }

      validFiles.push(file)
    }

    if (errors.length > 0) {
      showError(errors.join('\n'))
      return
    }

    if (validFiles.length === 0) {
      return
    }

    setUploading(true)
    const newUrls: string[] = []

    for (const file of validFiles) {
      if (newUrls.length + value.length >= maxImages) break

      const url = await uploadImage(file)
      if (url) {
        newUrls.push(url)
      } else {
        showError(`Erro ao fazer upload da imagem: ${file.name}`)
      }
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls])
      showSuccess(`${newUrls.length} imagem(ns) adicionada(s) com sucesso!`)
    }

    setUploading(false)
  }, [value, onChange, maxImages, maxSizeMB])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: uploading || value.length >= maxImages
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
                  onError={(e) => {
                    e.currentTarget.src = defaultImage // CORRIGIDO: Usando placeholder local
                  }}
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Fazendo upload...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    {isDragActive ? (
                      <>
                        <Upload className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-green-600">Solte a imagem aqui</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Clique ou arraste a imagem
                        </p>
                        <p className="text-xs text-gray-500">
                          Max: {maxSizeMB}MB • {maxImages} imagens
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <p className="text-sm text-gray-600">
        Envie até {maxImages} imagens. Formato: JPG, PNG. Tamanho máximo: {maxSizeMB}MB por imagem.
      </p>
    </div>
  )
}

export default ImageUpload