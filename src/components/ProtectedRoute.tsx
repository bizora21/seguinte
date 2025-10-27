import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'cliente' | 'vendedor'
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se o usuário for o administrador, ele tem acesso a todas as rotas protegidas (exceto as estritamente de cliente, que não existem aqui)
  const ADMIN_EMAIL = 'lojarapidamz@outlook.com'
  const userEmailNormalized = (user.profile?.email || user.email)?.toLowerCase().trim()
  const isAdmin = userEmailNormalized === ADMIN_EMAIL.toLowerCase().trim()

  if (requiredRole && user.profile?.role !== requiredRole && !isAdmin) {
    // Se um papel específico é exigido E o usuário não tem esse papel E não é o admin, nega o acesso.
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute