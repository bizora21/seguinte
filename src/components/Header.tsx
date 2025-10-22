import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { ShoppingCart, User, Search, Menu, X, LayoutDashboard, Store, MessageCircle } from 'lucide-react'
import CartButton from './CartButton'
import Logo from './Logo'

const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('/')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => navigate('/produtos')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Produtos
            </button>
            <button
              onClick={() => navigate('/lojas')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Lojas
            </button>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <CartButton />
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:block">{user.email.split('@')[0]}</span>
                </button>

                {/* Dropdown Menu */}
                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {user.profile?.role === 'vendedor' ? (
                      <>
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => navigate('/adicionar-produto')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                        >
                          <Store className="w-4 h-4" />
                          <span>Adicionar Produto</span>
                        </button>
                        <button
                          onClick={() => navigate('/meus-chats')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Meus Chats</span>
                        </button>
                        <button
                          onClick={() => navigate(`/loja/${user.id}`)}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                        >
                          <Store className="w-4 h-4" />
                          <span>Minha Loja</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate('/meus-pedidos')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Meus Pedidos</span>
                        </button>
                        <button
                          onClick={() => navigate('/meus-chats')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Minhas Conversas</span>
                        </button>
                      </>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                    >
                      <User className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  size="sm"
                >
                  Entrar
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  size="sm"
                >
                  Cadastrar
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