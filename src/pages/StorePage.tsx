import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product, ProductWithSeller } from '../types/product'
import { Profile } from '../types/auth'
import ProductCard from '../components/ProductCard'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Store, Star, MessageCircle, ArrowLeft, Package } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { showSuccess } from '../utils/toast'
import { SEO, generateStoreSchema, generateBreadcrumbSchema } from '../components/SEO'

const StorePage = () => {
  const { sellerId } = useParams<{ sellerId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [seller, setSeller] = useState<Profile | null>(null)
  const [products, setProducts] = useState<ProductWithSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sellerId) {
      fetchStoreData()
    }
  }, [sellerId])

  const fetchStoreData = async () => {
    setLoading(true)
    try {
      // Buscar perfil do vendedor
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId!)
        .eq('role', 'vendedor')
        .single()

      if (sellerError) throw sellerError
      setSeller(sellerData)

      // Buscar produtos do vendedor
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey (
            id,
            store_name,
            email
          )
        `)
        .eq('seller_id', sellerId!)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError
      setProducts(productsData || [])

    } catch (error) {
      console.error('Error fetching store data:', error)
      setSeller(null)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleContactSeller = () => {
    if (!user) {
      navigate('/login')
      return
    }
    showSuccess('Para iniciar uma conversa, por favor, vá para a página de um produto específico.')
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Loja Não Encontrada
              </h2>
              <p className="text-gray-600">
                Esta loja não existe ou não está mais disponível.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  const storeName = seller.store_name || `Loja ${seller.email.split('@')[0]}`;
  const storeUrl = `https://lojarapida.co.mz/loja/${sellerId}`;
  const storeSchema = generateStoreSchema(storeName, sellerId!);
  
  const breadcrumbs = [
    { name: 'Início', url: 'https://lojarapida.co.mz/' },
    { name: 'Lojas', url: 'https://lojarapida.co.mz/lojas' },
    { name: storeName, url: storeUrl }
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <SEO
        title={`${storeName} | Loja Oficial na LojaRápida | Produtos em Moçambique`}
        description={`Explore todos os ${products.length} produtos de ${storeName}. Compre com pagamento na entrega e frete grátis na LojaRápida.`}
        url={storeUrl}
        type="profile"
        jsonLd={[storeSchema, breadcrumbSchema]}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Header da Loja */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center">
                <Store className="w-12 h-12 text-blue-600" />
              </div>
              
              <h1 className="text-4xl font-bold mb-2">
                {storeName}
              </h1>
              
              <p className="text-xl mb-6 opacity-90">
                {seller.email}
              </p>
              
              <div className="flex items-center justify-center space-x-6 mb-6">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span>4.8</span>
                </div>
                <div>
                  <span>{products.length} produtos</span>
                </div>
                <div>
                  <span>Vendedor desde {new Date(seller.created_at!).getFullYear()}</span>
                </div>
              </div>
              
              {user && user.id !== sellerId && (
                <Button
                  onClick={handleContactSeller}
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Entrar em Contato
                </Button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Produtos da Loja */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Produtos da Loja
            </h2>
            <p className="text-gray-600">
              Conheça todos os produtos oferecidos por {storeName}
            </p>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum produto disponível
                </h2>
                <p className="text-gray-600">
                  Esta loja ainda não adicionou produtos ao catálogo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}

export default StorePage