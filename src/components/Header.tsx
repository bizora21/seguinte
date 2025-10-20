import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingBag, Package, MessageCircle, Search, Store } from 'lucide-react'
import CartButton from './CartButton'
import { motion } from 'framer-motion'

const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <motion.button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LojaRápida
            </motion.button>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/busca')}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </motion.div>
            
            {user && <CartButton />}
            
            {user?.profile?.role === 'vendedor' && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/adicionar-produto')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/meus-pedidos')}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Meus Pedidos
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/meus-chats')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Meus Chats
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/loja/${user.id}`)}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Minha Loja
                  </Button>
                </motion.div>
              </>
            )}

            {user?.profile?.role === 'cliente' && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/meus-pedidos')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Meus Pedidos
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/meus-chats')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Minhas Conversas
                  </Button>
                </motion.div>
              </>
            )}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.email}
                  {user.profile && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({user.profile.role})
                    </span>
                  )}
                </span>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSignOut}
                  >
                    Sair
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => navigate('/register')}
                  >
                    Cadastro
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header