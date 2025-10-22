import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Profile } from '../types/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Store, Star, Package, ArrowLeft, Search, MapPin } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { Input } from '../components/ui/input'

const LojasPage = () => {
  const [sellers, setSellers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSellers, setFilteredSellers] = useState<Profile[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchSellers()
  }, [])

  useEffect(() => {
    // Filtrar vendedores baseado na busca
    if (searchQuery.trim() === '') {
      setFilteredSellers(sellers)
    } else {
      const filtered = sellers.filter(seller => 
        seller.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredSellers(filtered)
    }
  }, [searchQuery, sellers])

  const fetchSellers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendedor')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching sellers:', error)
      } else {
        setSellers(data || [])
        setFilteredSellers(data || [])
      }
    } catch (error) {
      console.error('Error fetching sellers:', error)
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="ml-3 text-gray-600">Carregando lojas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
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
            <h1 className="text-4xl font-bold mb-4">
              Descubra as Melhores Lojas
            </h1>
            <p className="text-xl mb-8 text-purple-100">
              Conheça os vendedores locais e explore produtos incríveis em todo Moçambique
            </p>
            
            {/* Barra de Busca */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar lojas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-lg h-12 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Todas as Lojas
          </h2>
          <p className="text-gray-600">
            {filteredSellers.length} loja{filteredSellers.length !== 1 ? 's' : ''} disponível{filteredSellers.length !== 1 ? 'is' : ''}
          </p>
        </div>

        {filteredSellers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'Nenhuma loja encontrada' : 'Nenhuma loja disponível'}
              </h2>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Tente usar outros termos na busca.' 
                  : 'Volte em breve para conhecer novas lojas!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredSellers.map((seller) => (
              <motion.div
                key={seller.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Store className="w-10 h-10 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl">
                      {seller.store_name || 'Loja Sem Nome'}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {seller.email}
                    </p>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span>4.8</span>
                      </div>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        <span>12 produtos</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>Vendedor desde {new Date(seller.created_at!).getFullYear()}</span>
                    </div>

                    <Button
                      onClick={() => navigate(`/loja/${seller.id}`)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      Ver Loja
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LojasPage