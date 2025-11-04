import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { MessageCircle } from 'lucide-react'

const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-1/2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-full">
          {/* Coluna da Esquerda: Detalhes do Produto */}
          <div className="space-y-6">
            {/* Galeria de Imagens */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="w-full h-96 object-contain rounded-lg bg-gray-100" />
                <div className="flex space-x-2 mt-4">
                  <Skeleton className="w-20 h-20" />
                  <Skeleton className="w-20 h-20" />
                </div>
              </CardContent>
            </Card>

            {/* Informações do Produto */}
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-6 w-1/4" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                
                <div className="space-y-2 border-t pt-4">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>

                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita: Chat */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <CardTitle className="text-lg"><Skeleton className="h-5 w-40" /></CardTitle>
                    <p className="text-sm text-gray-600"><Skeleton className="h-4 w-24" /></p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
                <div className="flex-1 overflow-y-auto space-y-4">
                  <div className="flex justify-start"><Skeleton className="h-10 w-3/4" /></div>
                  <div className="flex justify-end"><Skeleton className="h-10 w-2/3" /></div>
                  <div className="flex justify-start"><Skeleton className="h-10 w-4/5" /></div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailSkeleton