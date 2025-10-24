import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Button } from '../components/ui/button'
import { motion, Variants } from 'framer-motion'

const Index = () => {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithSeller[]>([])
  const [newProducts, setNewProducts] = useState<ProductWithSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
    fetchNewProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(id, store_name)
        `)
        .gt('stock', 0) // CORREÇÃO: Trocado de .eq('stock', true) para .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) throw error
      setFeaturedProducts(data || [])
    } catch (error) {
      console.error('Error fetching featured products:', error)
    }
  }

  const fetchNewProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(id, store_name)
        `)
        .gt('stock', 0) // CORREÇÃO: Trocado de .eq('stock', true) para .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(8)

      if (error) throw error
      setNewProducts(data || [])
    } catch (error) {
      console.error('Error fetching new products:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              O Maior Marketplace de
              <span className="block text-yellow-400">Moçambique</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Compre e venda com segurança. Conectamos vendedores locais com clientes em todo o país.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/produtos')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-3 text-lg"
              >
                Explorar Produtos
              </Button>
              <Button 
                size="lg"
                onClick={() => navigate('/login')} 
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold px-8 py-3 text-lg border-0"
              >
                Fazer Login
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Os melhores produtos selecionados para você
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featuredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* New Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Novos Produtos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              As últimas novidades na nossa plataforma
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {newProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Junte-se a milhares de vendedores e clientes que já confiam na LojaRápida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/produtos')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-3 text-lg"
                size="lg"
              >
                Explorar Produtos Agora
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold px-8 py-3 text-lg border-0"
                size="lg"
              >
                Criar Conta Gratuita
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Index