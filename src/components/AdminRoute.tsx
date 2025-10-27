import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner'

const ADMIN_EMAIL = 'lojarapidamz@outlook.com'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
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
    console.log('AdminRoute: Usuário não logado. Redirecionando para login.');
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const userEmailNormalized = (user.profile?.email || user.email)?.toLowerCase().trim()
  const adminEmailNormalized = ADMIN_EMAIL.toLowerCase().trim()
  
  const isAdmin = userEmailNormalized === adminEmailNormalized

  console.log(`AdminRoute Check: User Email: "${userEmailNormalized}" | Admin Email: "${adminEmailNormalized}" | Is Admin: ${isAdmin}`);

  if (!isAdmin) {
    // Logado, mas não é o admin: redireciona para a home
    console.error(`AdminRoute: Acesso negado a /admin para o usuário: ${userEmailNormalized}`);
    return <Navigate to="/" replace />
  }

  // É o administrador
  console.log('AdminRoute: Acesso concedido.');
  return <>{children}</>
}

export default AdminRoute