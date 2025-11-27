import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Button } from '../components/ui/button'
import { motion, Variants } from 'framer-motion'
import { 
  Store, 
  Package, 
  Shield, 
  Truck, 
  CreditCard,
  Users,
  ArrowRight,
  Loader2,
  CheckCircle,
  TrendingUp,
  Headphones,
  Search,
  ShoppingBag,
  TruckIcon,
  CreditCardIcon,
  MessageCircle,
  Star,
  Rocket
} from 'lucide-react'
import { SEO, generateWebSiteSchema, generateLocalBusinessSchema } from '../components/SEO'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithSeller[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showProducts, setShowProducts] = useState<boolean>(false)

  const fetchFeaturedProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(id, store_name)
        `)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(8) // Mostra 8 produtos para um grid equilibrado

      if (error) throw error
      setFeaturedProducts(data || [])
    } catch (err: any) {
      console.error('Error fetching featured products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShowProducts = () => {
    if (!showProducts) {
      fetchFeaturedProducts()
    }
    setShowProducts(true)
  }

  // Animações
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    }
  }

  // Seção de benefícios
  const benefits = [
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: 'Compra 100% Segura',
      description: 'Pagamento na entrega. Você só paga quando receber o produto.'
    },
    {
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: 'Entrega Grátis',
      description: 'Frete grátis para todo Moçambique. Entrega em 1 a 5 dias úteis.'
    },
    {
      icon: <Store className="w-8 h-8 text-purple-600" />,
      title: 'Apoie Vendedores Locais',
      description: 'Conectamos você com os melhores vendedores de todo o país.'
    },
    {
      icon: <CreditCard className="w-8 h-8 text-orange-600" />,
      title: 'Pagamento Flexível',
      description: 'Aceitamos M-Pesa, eMola, dinheiro e cartão na entrega.'
    }
  ]

  // Passos de como funciona
  const steps = [
    {
      icon: <Search className="w-6 h-6 text-green-600" />,
      title: 'Busque e Escolha',
      description: 'Navegue por milhares de produtos de vendedores locais.'
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
      title: 'Faça seu Pedido',
      description: 'Selecione os produtos e confira seu carrinho.'
    },
    {
      icon: <TruckIcon className="w-6 h-6 text-purple-600" />,
      title: 'Receba em Casa',
      description: 'Aguarde a entrega em 1 a 5 dias úteis e pague na hora.'
    },
    {
      icon: <CreditCardIcon className="w-6 h-6 text-orange-600" />,
      title: 'Avalie sua Experiência',
      description: 'Compartilhe sua experiência e ajude outros clientes.'
    }
  ]

  // Vantagens para clientes
  const clientBenefits = [
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: 'Segurança Garantida',
      description: 'Pague apenas quando receber o produto.'
    },
    {
      icon: <Truck className="w-5 h-5 text-blue-600" />,
      title: 'Entrega Rápida',
      description: 'Receba seus produtos em 1 a 5 dias úteis.'
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-purple-600" />,
      title: 'Suporte Direto',
      description: 'Converse diretamente com os vendedores.'
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      title: 'Produtos Verificados',
      description: 'Qualidade garantida por vendedores confiáveis.'
    }
  ]

  // Vantagens para vendedores
  const sellerBenefits = [
    {
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      title: 'Alcance Nacional',
      description: 'Venda para clientes em todo Moçambique.'
    },
    {
      icon: <Headphones className="w-5 h-5 text-blue-600" />,
      title: 'Suporte Especializado',
      description: 'Ajuda dedicada para crescer seu negócio.'
    },
    {
      icon: <CreditCard className="w-5 h-5 text-purple-600" />,
      title: 'Pagamento Seguro',
      description: 'Receba seus pagamentos em meticais de forma segura.'
    },
    {
      icon: <Users className="w-5 h-5 text-orange-600" />,
      title: 'Plataforma Gratuita',
      description: 'Comece a vender sem custos iniciais.'
    }
  ]

  return (
    <>
      <SEO
        title="LojaRápida - Encomende e Venda Rápido em Moçambique"
        description="O marketplace mais confiável de Moçambique. Encomende produtos com pagamento na entrega ou comece a vender rápido para todo o país."
        url="https://lojarapidamz.com/"
        image="/og-image.jpg"
        jsonLd={[generateWebSiteSchema(), generateLocalBusinessSchema()]}
      />
      
      <div className="min-h-screen bg-white font-sans">
        
        {/* --- HERO SECTION --- */}
        <section className="relative overflow-hidden bg-[#0A2540] text-white pb-20 pt-24 lg:pt-32">
          {/* Background Pattern Suave */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="flex h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  <span className="text-sm font-medium text-green-50 tracking-wide uppercase">Marketplace #1 em Moçambique</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                  Encomende e Venda <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                    Rápido e Seguro
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Conectamos compradores e vendedores locais. 
                  <span className="text-white font-semibold"> Pagamento na entrega</span>, 
                  sem riscos, sem complicações.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    onClick={() => navigate('/lojas')}
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-105"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Encomendar Agora
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')}
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-white text-[#0A2540] hover:bg-gray-100 border-0 shadow-lg transition-all hover:scale-105"
                  >
                    <Store className="w-5 h-5 mr-2" />
                    Quero Vender
                  </Button>
                </div>

                {/* Trust Signals */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-medium text-gray-400">
                  <div className="flex items-center"><Shield className="w-5 h-5 mr-2 text-green-400" /> Compra 100% Segura</div>
                  <div className="flex items-center"><Truck className="w-5 h-5 mr-2 text-blue-400" /> Entrega em todo MZ</div>
                  <div className="flex items-center"><CreditCard className="w-5 h-5 mr-2 text-purple-400" /> Pague ao Receber</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- VALUE PROPOSITION (CARDS) --- */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que usar a LojaRápida?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Criamos uma plataforma pensada para a realidade de Moçambique, focada em confiança e agilidade.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Shield, title: "Pagamento Seguro", desc: "Nunca pague adiantado. O pagamento é feito apenas no ato da entrega, garantindo total segurança para o seu dinheiro.", color: "text-green-600", bg: "bg-green-50" },
                { icon: Rocket, title: "Entrega Expressa", desc: "Nossa rede logística parceira garante entregas rápidas em Maputo, Matola e envios seguros para todas as províncias.", color: "text-blue-600", bg: "bg-blue-50" },
                { icon: Users, title: "Apoio Local", desc: "Ao comprar na LojaRápida, você impulsiona pequenos negócios e empreendedores moçambicanos a crescerem.", color: "text-purple-600", bg: "bg-purple-50" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mb-6`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- DUAL CTA SECTION --- */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card Comprador */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-10 flex flex-col justify-between min-h-[300px]">
                <div className="relative z-10">
                  <div className="inline-flex items-center bg-white/20 rounded-full px-3 py-1 text-xs font-bold mb-4">
                    <ShoppingBag className="w-3 h-3 mr-1" /> PARA CLIENTES
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Quer comprar algo incrível?</h3>
                  <p className="text-blue-100 mb-8 max-w-md">Explore milhares de produtos únicos. Moda, eletrônicos, casa e muito mais.</p>
                  <Button onClick={() => navigate('/produtos')} className="bg-white text-blue-900 hover:bg-blue-50 font-bold">
                    Ver Catálogo
                  </Button>
                </div>
                <ShoppingBag className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
              </div>

              {/* Card Vendedor */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black text-white p-10 flex flex-col justify-between min-h-[300px]">
                <div className="relative z-10">
                  <div className="inline-flex items-center bg-white/20 rounded-full px-3 py-1 text-xs font-bold mb-4">
                    <TrendingUp className="w-3 h-3 mr-1" /> PARA EMPREENDEDORES
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Quer vender rápido?</h3>
                  <p className="text-gray-400 mb-8 max-w-md">Crie sua loja digital em minutos. Sem custos de adesão. Alcance todo o país.</p>
                  <Button onClick={() => navigate('/register')} className="bg-green-500 text-white hover:bg-green-600 font-bold">
                    Criar Minha Loja
                  </Button>
                </div>
                <Store className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURED PRODUCTS --- */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Achados da Semana</h2>
              <p className="text-gray-600">Produtos populares selecionados para você encomendar agora.</p>
            </div>

            {!showProducts ? (
              <div className="text-center">
                <Button 
                  onClick={handleShowProducts} 
                  size="lg" 
                  variant="outline"
                  className="h-14 px-8 text-lg border-2"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Carregar Produtos em Destaque
                </Button>
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-gray-400" /></div>
                ) : featuredProducts.length > 0 ? (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {featuredProducts.map((product) => (
                      <motion.div key={product.id} variants={itemVariants} className="h-full">
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-gray-500">Nenhum produto em destaque no momento.</div>
                )}
                
                <div className="text-center mt-12">
                  <Button onClick={() => navigate('/produtos')} className="bg-[#0A2540] hover:bg-gray-800 text-white px-8">
                    Ver Todos os Produtos <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* --- SEO FOOTER TEXT --- */}
        <section className="py-12 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose max-w-none text-gray-500 text-sm">
              <h3 className="text-gray-900 font-semibold mb-2">Sobre Compras Online em Moçambique</h3>
              <p>
                A LojaRápida está transformando o comércio eletrônico em Moçambique. Nossa plataforma permite que você encomende produtos de vendedores em Maputo, Matola, Beira, Nampula e outras províncias com facilidade. 
                Diferente de outros sites, focamos na segurança do "Cash on Delivery" (Pagamento na Entrega), eliminando o medo de fraudes online. 
                Seja para comprar eletrônicos, moda, produtos para casa ou beleza, a LojaRápida é o seu destino confiável. Venda rápido seus produtos criando uma conta de vendedor gratuita hoje mesmo.
              </p>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}

export default HomePage