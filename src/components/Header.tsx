import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { ShoppingCart, User, Menu, X, LayoutDashboard, Store, MessageCircle, LogOut, Package, Home } from 'lucide-react'
import CartButton from './CartButton'
import Logo from './Logo'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Avatar, AvatarFallback } from './ui/avatar'
import CategoryMenu from './CategoryMenu'

const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getAvatarFallbackText = () => {
    if (!user) return '?'
    
    const profile = user.profile
    
    if (profile?.store_name) {
      // Usa as duas primeiras letras do nome da loja
      return profile.store_name.slice(0, 2).toUpperCase()
    }
    
    if (user.email) {
      // Usa a primeira letra do email
      return user.email.charAt(0).toUpperCase()
    }
    
    // Usa a primeira letra do papel (V ou C)
    if (profile?.role === 'vendedor') return 'V'
    if (profile?.role === 'cliente') return 'C'
    
    return 'U'
  }

  const navLinks = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Produtos', href: '/produtos', icon: Package },
    { name: 'Lojas', href: '/lojas', icon: Store },
    { name: 'Blog', href: '/blog', icon: MessageCircle },
    { name: 'Sobre Nós', href: '/sobre-nos', icon: User },
  ]

  const userMenuItems = user?.profile?.role === 'vendedor' ? [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Adicionar Produto', href: '/adicionar-produto', icon: Package },
    { name: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingCart },
    { name: 'Meus Chats', href: '/meus-chats', icon: MessageCircle },
    { name: 'Minha Loja', href: `/loja/${user.id}`, icon: Store },
  ] : [
    { name: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingCart },
    { name: 'Minhas Conversas', href: '/meus-chats', icon: MessageCircle },
  ]

  const renderUserMenuContent = (isMobile: boolean) => (
    <>
      {userMenuItems.map((item) => (
        <Link key={item.name} to={item.href} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
          <div className={`flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 ${isMobile ? 'md:hidden' : ''}`}>
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
          </div>
        </Link>
      ))}
      <div className={`px-4 py-2 ${isMobile ? 'md:hidden' : ''}`}>
        <Button
          onClick={handleSignOut}
          variant="destructive"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </>
  )

  return (
    <header className="bg-white shadow-md sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation (Central) */}
          <nav className="hidden lg:flex items-center space-x-6">
            <CategoryMenu />
            {navLinks.slice(0, 5).map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-700 font-medium hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <CartButton />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 bg-secondary text-white">
                      {/* Se houver avatar_url, use AvatarImage */}
                      {/* <AvatarImage src={user.profile?.avatar_url} alt="Avatar" /> */}
                      <AvatarFallback className="bg-secondary text-white">
                        {getAvatarFallbackText()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-medium leading-none">
                      {user.profile?.store_name || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {userMenuItems.map((item) => (
                    <DropdownMenuItem key={item.name} onClick={() => navigate(item.href)} className="cursor-pointer">
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.name}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
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

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center space-x-2">
            <CartButton />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center">
                    <Logo size="sm" />
                    <span className="ml-2">Menu</span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* User Info / Auth */}
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        <Avatar className="h-10 w-10 bg-secondary text-white">
                          <AvatarFallback className="bg-secondary text-white">
                            {getAvatarFallbackText()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{user.profile?.store_name || user.email.split('@')[0]}</p>
                          <p className="text-sm text-gray-600">{user.profile?.role === 'vendedor' ? 'Vendedor' : 'Cliente'}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {userMenuItems.map((item) => (
                          <Button
                            key={item.name}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              navigate(item.href)
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            <item.icon className="w-4 h-4 mr-2" />
                            {item.name}
                          </Button>
                        ))}
                      </div>
                      <Button
                        onClick={handleSignOut}
                        variant="destructive"
                        className="w-full"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false) }} className="w-full">
                        Entrar
                      </Button>
                      <Button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false) }} variant="outline" className="w-full">
                        Cadastrar
                      </Button>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-1">
                    <h3 className="text-lg font-semibold mb-2">Navegação</h3>
                    {navLinks.map((link) => (
                      <Button
                        key={link.name}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          navigate(link.href)
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <link.icon className="w-4 h-4 mr-2" />
                        {link.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header