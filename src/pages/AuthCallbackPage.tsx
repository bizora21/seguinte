import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

const AuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        navigate('/login?msg=link-invalido', { replace: true })
        return
      }
      const role = (session.user.user_metadata as any)?.role
      if (role === 'vendedor') {
        navigate('/dashboard/seller', { replace: true })
      } else {
        navigate('/produtos', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 text-sm">A verificar a sua conta...</p>
    </div>
  )
}

export default AuthCallbackPage
