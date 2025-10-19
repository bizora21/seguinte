import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import SellerChats from './SellerChats'
import CustomerChats from './CustomerChats'

const MyChats = () => {
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
    return <SellerChats />
  } else if (user.profile?.role === 'cliente') {
    return <CustomerChats />
  } else {
    // Se não tiver role definido, redireciona para home
    navigate('/')
    return null
  }
}

export default MyChats