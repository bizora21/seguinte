import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Profile } from '../types/auth'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Store, Star, Package, ArrowLeft, Search, MapPin, Shield, Users, Clock, Heart, TrendingUp } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { Input } from '../components/ui/input'
import LoadingSpinner from '../components/LoadingSpinner'
import { SEO } from '../components/SEO'

const LojasPage = () => {
  const [sellers, setSellers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSellers, setFilteredSellers] = useState<Profile[]>([])
  const navigate = useNavigate()

  // Dados mockados para estatísticas (em um sistema real, viriam do banco)
  const getSellerStats = (sellerId: string) => {
    const stats = {
      products: Math.floor(Math.random() * 50) + 10,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      sales: Math.floor(Math.random() * 200) + 20,
      responseTime: Math.floor(Math.random() * 12) + 1
    }
    return stats
  }

  // Gera uma URL de imagem consistente para cada loja usando o ID como seed
  const getSellerImage = (sellerId: string, storeName: string) => {
    const seed = `${storeName.replace(/\s+/g, '')}-${sellerId.slice(-6)}`
    return `https://picsum.photos/seed/${seed}/400/300.jpg`
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSellers(sellers)
    } else {
      const filtered = sellers.filter(seller => 
        seller.store_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredSellers(filtered)
    }
  }, [searchQuery, sellers])

  const fetchSellers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Iniciando busca de vendedores...')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendedor')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro na query de vendedores:', error)
        setError(`Erro ao carregar lojas: ${error.message}`)
        return
      }

      console.log('✅ Dados recebidos:', data)
      setSellers(data || [])
      setFilteredSellers(data || [])
      
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar vendedores:', error)
      setError('Erro inesperado ao carregar lojas')
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

  const handleRetry = () => {
    fetchSellers()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-MZ').format(num)
  }

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating)
    const fullStars = Math.floor(numRating)
    const hasHalfStar = numRating % 1 >= 0.5
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'text-yellow-400 fill-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title="Lojas em Destaque | Vendedores Locais em Moçambique | LojaRápida"
        description="Encontre as melhores lojas e vendedores em Moçambique. Explore catálogos completos e compre com segurança na LojaRápida."
        url="https://lojarapida.co.mz/lojas"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section - Reduzido o padding vertical */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4">
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Descubra as Melhores Lojas
              </h1>
              <p className="text-xl mb-6 text-purple-100">
                Conheça os vendedores locais e explore produtos incríveis em todo Moçambique
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Buscar lojas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-lg h-12 bg-white text-gray-900 placeholder-gray-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">{sellers.length}+</div>
                <div className="text-gray-600">Lojas Ativas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
                <div className="text-gray-600">Produtos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
                <div className="text-gray-600">Clientes Felizes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">4.8</div>
                <div className="text-gray-600">Avaliação Média</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Error State */}
          {error && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Store className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">Erro ao carregar lojas</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                  <Button 
                    onClick={handleRetry} 
                    variant="outline" 
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'Resultados da Busca' : 'Lojas em Destaque'}
            </h2>
            <p className="text-gray-600">
              {filteredSellers.length} loja{filteredSellers.length !== 1 ? 's' : ''} encontrada{filteredSellers.length !== 1 ? 's' : ''}
              {!error && sellers.length > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  (Total no banco: {sellers.length})
                </span>
              )}
            </p>
          </div>

          {/* Empty State */}
          {filteredSellers.length === 0 && !error ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Store className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'Nenhuma loja encontrada' : 'Nenhuma loja disponível'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Tente usar outros termos na busca.' 
                    : 'Volte em breve para conhecer novas lojas incríveis!'
                  }
                </p>
                <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700">
                  Explorar Produtos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredSellers.map((seller) => {
                const stats = getSellerStats(seller.id)
                const imageUrl = getSellerImage(seller.id, seller.store_name || '')
                
                return (
                  <motion.div
                    key={seller.id}
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
                  >
                    <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white">
                      {/* Imagem da Loja */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={seller.store_name || 'Loja'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/seed/fallback-${seller.id}/400/300.jpg`
                          }}
                        />
                        
                        {/* Badge de Confiança */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-gray-700">Verificado</span>
                          </div>
                        </div>

                        {/* Overlay de Informações */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span className="text-sm font-medium">{stats.products} produtos</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm font-medium">{stats.sales} vendas</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do Card */}
                      <CardContent className="p-5">
                        {/* Nome da Loja */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-1">
                          {seller.store_name || 'Loja Sem Nome'}
                        </h3>

                        {/* Avaliação e Tempo de Resposta */}
                        <div className="flex items-center justify-between mb-4">
                          {renderStars(stats.rating)}
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{stats.responseTime}h</span>
                          </div>
                        </div>

                        {/* Informações Adicionais */}
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>Moçambique</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{formatNumber(stats.sales)} clientes</span>
                          </div>
                        </div>

                        {/* Call-to-Action Button */}
                        <Button
                          onClick={() => navigate(`/loja/${seller.id}`)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-300 transform hover:scale-105"
                        >
                          <Store className="w-4 h-4 mr-2" />
                          Ver Loja
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}

export default LojasPage