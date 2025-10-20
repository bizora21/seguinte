import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingBag, Package, MessageCircle, Search, Store } from 'lucide-react'
import CartButton from './CartButton'
import { motion } from 'framer-motion'
import Logo from './Logo'

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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo size="md" />
            </motion.button>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/busca')}
                className="text-gray-600 hover:text-gray-900"
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
                    className="border-green-600 text-green-600 hover:bg-green-50"
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Login
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm"
                    onClick={() => navigate('/register')}
                    className="bg-green-600 hover:bg-green-700 text-white"
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