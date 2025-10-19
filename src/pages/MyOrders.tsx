import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import SellerOrders from './SellerOrders'
import CustomerOrders from './CustomerOrders'

const MyOrders = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  // Renderiza o componente correto baseado no role do usuário
  if (user.profile?.role === 'vendedor') {
    return <SellerOrders />
  } else if (user.profile?.role === 'cliente') {
    return <CustomerOrders />
  } else {
    // Se não tiver role definido, redireciona para home
    navigate('/')
    return null
  }
}

export default MyOrders