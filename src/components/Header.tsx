import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  Package, 
  MessageCircle, 
  Store, 
  LayoutDashboard,
  ChevronDown,
  Search,
  LogOut,
  ShoppingBag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'

const Header = () => {
  const { user, signOut } = useAuth()
  const { getCartItemsCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const cartItemsCount = getCartItemsCount()

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setIsCategoriesDropdownOpen(false)
      setIsUserDropdownOpen(false)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  // Links de navegação principal
  const navLinks = [
    { name: 'Lojas', href: '/lojas', hasDropdown: false },
    { name: 'Categorias', href: '#', hasDropdown: true },
    { name: 'Blog', href: '/blog', hasDropdown: false },
    { name: 'Sobre Nós', href: '/sobre', hasDropdown: false }
  ]

  // Links do dropdown de categorias
  const categoryLinks = [
    { name: 'Eletrônicos', href: '/busca?categoria=eletronicos' },
    { name: 'Roupas', href: '/busca?categoria=roupas' },
    { name: 'Móveis', href: '/busca?categoria=moveis' },
    { name: 'Livros', href: '/busca?categoria=livros' },
    { name: 'Esportes', href: '/busca?categoria=esportes' },
    { name: 'Ver Todas', href: '/produtos' }
  ]

  // Animações para o menu mobile
  const mobileMenuVariants = {
    hidden: { opacity: 0, x: '100%' },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: '100%' }
  }

  return (
    <>
      {/* Header Principal */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg p-1"
              >
                <Logo size="md" />
              </button>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <div key={link.name} className="relative">
                  {link.hasDropdown ? (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)
                        }}
                        className={`flex items-center space-x-1 text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          isCategoriesDropdownOpen ? 'text-green-600 bg-green-50' : ''
                        }`}
                      >
                        <span>{link.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                          isCategoriesDropdownOpen ? 'rotate-180' : ''
                        }`} />
                      </button>
                      
                      {/* Dropdown Categorias */}
                      <AnimatePresence>
                        {isCategoriesDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {categoryLinks.map((category) => (
                              <button
                                key={category.name}
                                onClick={() => navigate(category.href)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                              >
                                {category.name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(link.href)}
                      className={`text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActiveRoute(link.href) 
                          ? 'text-green-600 bg-green-50' 
                          : ''
                      }`}
                    >
                      {link.name}
                    </button>
                  )}
                </div>
              ))}
            </nav>

            {/* Ações do Usuário Desktop */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Barra de Busca Rápida */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-64 px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/busca?q=${encodeURIComponent(e.currentTarget.value)}`)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Buscar produtos..."]') as HTMLInputElement
                    if (input?.value) {
                      navigate(`/busca?q=${encodeURIComponent(input.value)}`)
                    }
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {user ? (
                <>
                  {/* Carrinho */}
                  <button
                    onClick={() => navigate('/carrinho')}
                    className="relative p-2 text-gray-700 hover:text-green-600 transition-colors duration-200"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {cartItemsCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown do Usuário */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsUserDropdownOpen(!isUserDropdownOpen)
                      }}
                      className="flex items-center space-x-2 p-2 text-gray-700 hover:text-green-600 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        isUserDropdownOpen ? 'rotate-180' : ''
                      }`} />
                    </button>

                    <AnimatePresence>
                      {isUserDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.profile?.role === 'vendedor' ? 'Vendedor' : 'Cliente'}
                            </p>
                          </div>

                          <div className="py-2">
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
                                  onClick={() => navigate('/lojas')}
                                  className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                                >
                                  <Store className="w-4 h-4" />
                                  <span>Explorar Lojas</span>
                                </button>
                                <button
                                  onClick={() => navigate('/produtos')}
                                  className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                                >
                                  <ShoppingBag className="w-4 h-4" />
                                  <span>Explorar Produtos</span>
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={() => navigate('/meus-pedidos')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                            >
                              <Package className="w-4 h-4" />
                              <span>Meus Pedidos</span>
                            </button>
                            
                            <button
                              onClick={() => navigate('/meus-chats')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Minhas Conversas</span>
                            </button>
                          </div>

                          <div className="border-t border-gray-200 py-2">
                            <button
                              onClick={handleSignOut}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sair</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  >
                    Entrar
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                  >
                    Cadastrar
                  </Button>
                </>
              )}
            </div>

            {/* Menu Mobile Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-700 hover:text-green-600 transition-colors duration-200"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Mobile Fullscreen */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Content */}
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
              <div className="flex flex-col h-full">
                {/* Header do Menu Mobile */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <Logo size="sm" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Conteúdo do Menu */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Busca Mobile */}
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          navigate(`/busca?q=${encodeURIComponent(e.currentTarget.value)}`)
                          setIsMobileMenuOpen(false)
                        }
                      }}
                    />
                  </div>

                  {/* Links de Navegação */}
                  <nav className="space-y-2 mb-6">
                    {navLinks.map((link) => (
                      <button
                        key={link.name}
                        onClick={() => {
                          if (link.hasDropdown) {
                            // Toggle dropdown mobile
                            setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)
                          } else {
                            navigate(link.href)
                            setIsMobileMenuOpen(false)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                          isActiveRoute(link.href) 
                            ? 'bg-green-50 text-green-600' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {link.name}
                      </button>
                    ))}

                    {/* Categorias Mobile */}
                    {isCategoriesDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 space-y-1"
                      >
                        {categoryLinks.map((category) => (
                          <button
                            key={category.name}
                            onClick={() => {
                              navigate(category.href)
                              setIsMobileMenuOpen(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-green-600 transition-colors duration-200"
                          >
                            {category.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </nav>

                  {/* Ações do Usuário */}
                  {user ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.profile?.role === 'vendedor' ? 'Vendedor' : 'Cliente'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {/* Carrinho */}
                        <button
                          onClick={() => {
                            navigate('/carrinho')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <ShoppingCart className="w-5 h-5" />
                            <span>Carrinho</span>
                          </div>
                          {cartItemsCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {cartItemsCount}
                            </span>
                          )}
                        </button>

                        {user.profile?.role === 'vendedor' ? (
                          <>
                            <button
                              onClick={() => {
                                navigate('/dashboard')
                                setIsMobileMenuOpen(false)
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            >
                              <LayoutDashboard className="w-5 h-5" />
                              <span>Dashboard</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/adicionar-produto')
                                setIsMobileMenuOpen(false)
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            >
                              <Store className="w-5 h-5" />
                              <span>Adicionar Produto</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                navigate('/lojas')
                                setIsMobileMenuOpen(false)
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            >
                              <Store className="w-5 h-5" />
                              <span>Explorar Lojas</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/produtos')
                                setIsMobileMenuOpen(false)
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            >
                              <ShoppingBag className="w-5 h-5" />
                              <span>Explorar Produtos</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            navigate('/meus-pedidos')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          <Package className="w-5 h-5" />
                          <span>Meus Pedidos</span>
                        </button>

                        <button
                          onClick={() => {
                            navigate('/meus-chats')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>Minhas Conversas</span>
                        </button>

                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Sair</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate('/login')
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Entrar
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('/register')
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Cadastrar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header