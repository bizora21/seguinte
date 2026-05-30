import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import {
  ShoppingCart, User, LayoutDashboard, Store, MessageCircle,
  LogOut, Package, Home, Heart, ChevronRight, BookOpen, Tag
} from 'lucide-react'
import CartButton from './CartButton'
import Logo from './Logo'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Separator } from './ui/separator'
import CategoryMenu from './CategoryMenu'
import AdminNotificationBell from './AdminNotificationBell'
import { ADMIN_EMAIL } from '../lib/constants'

const HamburgerIcon = ({ open }: { open: boolean }) => (
  <div className="w-5 h-5 flex flex-col justify-center items-center gap-[5px]">
    <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 origin-center ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
    <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ${open ? 'opacity-0 scale-x-0' : ''}`} />
    <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 origin-center ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
  </div>
)

const Header = () => {
  const { user, signOut } = useAuth()
  const { count: wishlistCount } = useWishlist()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  // Categorias para o drawer mobile (vêm da tabela `categories` no Supabase).
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')
      .then(({ data, error }) => {
        if (error) console.error('Header: erro a buscar categorias -', error.message)
        else setCategories(data || [])
      })
  }, [])

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const getAvatarFallbackText = () => {
    if (!user) return '?'
    const profile = user.profile
    if (profile?.store_name) return profile.store_name.slice(0, 2).toUpperCase()
    if (user.email) return user.email.charAt(0).toUpperCase()
    if (profile?.role === 'vendedor') return 'V'
    if (profile?.role === 'cliente') return 'C'
    return 'U'
  }

  const navLinks = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Produtos', href: '/produtos', icon: Package },
    { name: 'Lojas', href: '/lojas', icon: Store },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Sobre Nós', href: '/sobre-nos', icon: User },
  ]

  const userMenuItems = user?.profile?.role === 'vendedor' ? [
    { name: 'Dashboard', href: '/dashboard/seller', icon: LayoutDashboard },
    { name: 'Adicionar Produto', href: '/adicionar-produto', icon: Package },
    { name: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingCart },
    { name: 'Meus Chats', href: '/meus-chats', icon: MessageCircle },
    { name: 'Minha Loja', href: `/loja/${user.id}`, icon: Store },
  ] : [
    { name: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingCart },
    { name: 'Minhas Conversas', href: '/meus-chats', icon: MessageCircle },
  ]

  if (isAdmin) {
    userMenuItems.unshift({ name: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard })
  }

  const closeMobileMenu = (href: string) => {
    setIsMobileMenuOpen(false)
    navigate(href)
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
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

          {/* Desktop Right Actions (≥ lg) */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAdmin && <AdminNotificationBell isAdmin={isAdmin} />}

            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-red-500 transition-colors" aria-label="Lista de desejos">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <CartButton />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 bg-secondary text-white">
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
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
                <Button onClick={() => navigate('/login')} variant="outline" size="sm">Entrar</Button>
                <Button onClick={() => navigate('/register')} size="sm">Cadastrar</Button>
              </div>
            )}
          </div>

          {/* Mobile + Tablet: cart + wishlist + hamburger (< lg) */}
          <div className="lg:hidden flex items-center gap-1">
            {isAdmin && <AdminNotificationBell isAdmin={isAdmin} />}

            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-red-500 transition-colors" aria-label="Lista de desejos">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <CartButton />

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-700" aria-label="Menu">
                  <HamburgerIcon open={isMobileMenuOpen} />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col overflow-hidden">
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
                  <Logo size="sm" />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* User block */}
                  {user ? (
                    <div className="px-5 py-5 bg-gray-50 border-b">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 bg-secondary text-white flex-shrink-0">
                          <AvatarFallback className="bg-secondary text-white text-lg font-bold">
                            {getAvatarFallbackText()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {user.profile?.store_name || user.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {user.profile?.role === 'vendedor' ? 'Vendedor' : 'Cliente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-5 bg-gray-50 border-b space-y-3">
                      <p className="text-sm text-gray-500 font-medium">Bem-vindo à LojaRápida</p>
                      <div className="flex gap-3">
                        <Button onClick={() => closeMobileMenu('/login')} className="flex-1">Entrar</Button>
                        <Button onClick={() => closeMobileMenu('/register')} variant="outline" className="flex-1">Cadastrar</Button>
                      </div>
                    </div>
                  )}

                  {/* Navegação principal */}
                  <div className="px-3 py-3">
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Explorar</p>
                    {navLinks.map((link) => (
                      <button
                        key={link.name}
                        onClick={() => closeMobileMenu(link.href)}
                        className="w-full flex items-center justify-between px-3 py-4 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <link.icon className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                          <span className="text-base font-medium">{link.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>

                  {/* Categorias */}
                  {categories.length > 0 && (
                    <>
                      <Separator />
                      <div className="px-3 py-3">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Categorias</p>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => closeMobileMenu(`/produtos?categoria=${cat.slug}`)}
                            className="w-full flex items-center justify-between px-3 py-4 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Tag className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                              <span className="text-base font-medium">{cat.name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Itens do utilizador autenticado */}
                  {user && (
                    <>
                      <Separator />
                      <div className="px-3 py-3">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">A minha conta</p>
                        {userMenuItems.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => closeMobileMenu(item.href)}
                            className="w-full flex items-center justify-between px-3 py-4 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                              <span className="text-base font-medium">{item.name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                          </button>
                        ))}
                      </div>

                      <Separator />
                      <div className="px-5 py-4">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-4 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="text-base font-medium">Sair da conta</span>
                        </button>
                      </div>
                    </>
                  )}
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
