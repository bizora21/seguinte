import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types/product'
import { Profile } from '../types/auth'
import ProductCard from '../components/ProductCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Store, Star, MessageCircle, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { showSuccess } from '../utils/toast'

const StorePage = () => {
  const { sellerId } = useParams<{ sellerId: string }>()
  const { user } = useAuth()
  const [seller, setSeller] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sellerId) {
      fetchSellerData()
      fetchSellerProducts()
    }
  }, [sellerId])

  const fetchSellerData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId!)
        .eq('role', 'vendedor')
        .single()

      if (error) {
        console.error('Error fetching seller:', error)
      } else {
        setSeller(data)
      }
    } catch (error) {
      console.error('Error fetching seller:', error)
    }
  }

  const fetchSellerProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId!)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactSeller = async () => {
    if (!user || !sellerId) {
      return
    }

    // Verificar se já existe algum chat com este vendedor
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('client_id', user.id)
      .limit(1)
      .single()

    if (existingChat) {
      window.location.href = `/chat/${existingChat.id}`
    } else {
      showSuccess('Entre em contato através da página de um produto específico')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Loja */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
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
              {seller.store_name || 'Loja Sem Nome'}
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
                <span>Vendedor desde {new Date(seller.created_at).getFullYear()}</span>
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
            Conheça todos os produtos oferecidos por {seller.store_name || 'esta loja'}
          </p>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
  )
}

export default StorePage