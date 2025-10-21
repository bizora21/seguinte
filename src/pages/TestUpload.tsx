import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../utils/toast'
import ImageUpload from '../components/ImageUpload'

const TestUpload = () => {
  const [images, setImages] = useState<string[]>([])
  const [testing, setTesting] = useState(false)

  const testStorageConnection = async () => {
    setTesting(true)
    
    try {
      // Testar listagem de arquivos no bucket
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('products', {
          limit: 10
        })

      if (error) {
        console.error('Storage error:', error)
        showError('Erro ao conectar com o storage: ' + error.message)
      } else {
        console.log('Storage connection successful:', data)
        showSuccess('Conexão com storage funcionando!')
      }
    } catch (error) {
      console.error('Test error:', error)
      showError('Erro inesperado ao testar storage')
    } finally {
      setTesting(false)
    }
  }

  const createBucket = async () => {
    setTesting(true)
    
    try {
      // Tentar criar o bucket (isso pode falhar se já existir ou se não tiver permissão)
      const { error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 1048576 // 1MB
      })

      if (error) {
        console.error('Bucket creation error:', error)
        if (error.message.includes('already exists')) {
          showSuccess('Bucket já existe!')
        } else {
          showError('Erro ao criar bucket: ' + error.message)
        }
      } else {
        showSuccess('Bucket criado com sucesso!')
      }
    } catch (error) {
      console.error('Create bucket error:', error)
      showError('Erro inesperado ao criar bucket')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Teste de Upload de Imagens</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teste de Conexão */}
          <Card>
            <CardHeader>
              <CardTitle>Testar Conexão com Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Verifica se a conexão com o Supabase Storage está funcionando.
              </p>
              <Button 
                onClick={testStorageConnection}
                disabled={testing}
                className="w-full"
              >
                {testing ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </CardContent>
          </Card>

          {/* Criar Bucket */}
          <Card>
            <CardHeader>
              <CardTitle>Criar Bucket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Cria o bucket 'product-images' se não existir.
              </p>
              <Button 
                onClick={createBucket}
                disabled={testing}
                variant="outline"
                className="w-full"
              >
                {testing ? 'Criando...' : 'Criar Bucket'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Teste de Upload */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Teste de Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Teste o componente de upload de imagens aqui.
              </p>
              
              <ImageUpload
                value={images}
                onChange={setImages}
                maxImages={2}
                maxSizeMB={1}
              />

              {images.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Imagens carregadas:</h3>
                  <div className="space-y-2">
                    {images.map((url, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <img 
                          src={url} 
                          alt={`Test ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver imagem {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TestUpload