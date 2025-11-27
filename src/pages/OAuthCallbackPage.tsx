import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import OAuthCallbackModal from '../components/Marketing/OAuthCallbackModal'
import { Card, CardContent } from '../components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')
  const errorDesc = searchParams.get('error_description')

  const handleComplete = () => {
    navigate('/dashboard/admin/marketing?tab=settings')
  }

  // Se houver erro na URL (retornado pelo Facebook)
  if (error) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
              <Card className="w-full max-w-md border-red-200 bg-red-50 shadow-lg">
                  <CardContent className="p-8 text-center text-red-900">
                      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <h2 className="text-xl font-bold mb-2">Conexão Recusada</h2>
                      <p className="font-medium">{errorReason || 'O Facebook não autorizou a conexão.'}</p>
                      <p className="text-sm mt-4 text-red-700 bg-white/50 p-2 rounded border border-red-100 font-mono">
                        {errorDesc || error}
                      </p>
                      <Button onClick={handleComplete} className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white">
                        Voltar ao Painel
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  // Se não houver código, redireciona de volta
  if (!code) {
      setTimeout(() => handleComplete(), 2000)
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <p className="text-gray-500">Redirecionando...</p>
        </div>
      )
  }

  // Se tiver código, mostra o modal de processamento
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <OAuthCallbackModal 
            code={code} 
            stateParam={state} 
            onComplete={handleComplete} 
        />
    </div>
  )
}

export default OAuthCallbackPage