import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

const AuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // O Supabase devolve erros nos parâmetros do URL (hash ou query).
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const queryParams = new URLSearchParams(window.location.search)
    const hasError = hashParams.get('error') || queryParams.get('error')

    navigate(hasError ? '/login?confirmado=erro' : '/login?confirmado=1', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 text-sm">A confirmar a sua conta...</p>
    </div>
  )
}

export default AuthCallbackPage
