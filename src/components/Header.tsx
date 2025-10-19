import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingBag, Package } from 'lucide-react'
import CartButton from './CartButton'

const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              LojaRápida
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && <CartButton />}
            
            {user?.profile?.role === 'vendedor' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/adicionar-produto')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/meus-pedidos')}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Meus Pedidos
                </Button>
              </>
            )}

            {user?.profile?.role === 'cliente' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/meus-pedidos')}
              >
                <Package className="w-4 h-4 mr-2" />
                Meus Pedidos
              </Button>
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Cadastro
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header