import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { SEO } from '../components/SEO'

const TestSocial = () => {
  const navigate = useNavigate()
  const TEST_URL = 'https://lojarapidamz.com/teste-social'
  const TEST_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27fc?w=1200&h=630&fit=crop' // Imagem de tênis

  return (
    <>
      <SEO
        title="Produto de Teste Social - LojaRápida"
        description="Esta é uma descrição de teste para verificar se as meta tags dinâmicas estão a funcionar corretamente no Facebook Sharing Debugger."
        image={TEST_IMAGE}
        url={TEST_URL}
        type="product"
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </div>
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Página de Teste Social
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Esta página foi criada para verificar se o Facebook e outros rastreadores estão a ler as meta tags dinâmicas corretamente.
          </p>
          <p className="text-sm text-gray-500">
            URL Canônica Esperada: <code>{TEST_URL}</code>
          </p>
        </div>
      </div>
    </>
  )
}

export default TestSocial