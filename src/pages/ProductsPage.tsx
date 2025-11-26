import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Search, ListFilter, ArrowUpDown, Package } from 'lucide-react'
import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'
import ProductCardSkeleton from '../components/ProductCardSkeleton'

const fetchProducts = async (searchTerm: string, sortBy: string, category: string): Promise<ProductWithSeller[]> => {
  let query = supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey(id, store_name)
    `)
    .gt('stock', 0)

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  switch (sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as ProductWithSeller[]
}

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [category, setCategory] = useState('all')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  const { data: products, isLoading, isError, refetch } = useQuery<ProductWithSeller[], Error>({
    queryKey: ['products', debouncedSearchTerm, sortBy, category],
    queryFn: () => fetchProducts(debouncedSearchTerm, sortBy, category),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos para performance
  })

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'eletronicos', label: 'Eletrônicos' },
    { value: 'moda', label: 'Moda' },
    { value: 'casa', label: 'Casa e Decoração' },
    { value: 'esportes', label: 'Esportes' },
    { value: 'acessorios', label: 'Acessórios' },
    { value: 'beleza', label: 'Beleza' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  if (isError) {
    return (
      <div className="text-center p-8 min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-red-600">Erro ao carregar produtos.</h2>
        <Button onClick={() => refetch()} className="mt-4">Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho da Página */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Catálogo de Produtos</h1>
          <p className="text-base sm:text-lg text-gray-600">Explore milhares de produtos de vendedores locais em todo Moçambique.</p>
        </div>

        {/* Filtros e Ordenação */}
        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-16 z-30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Busca */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="O que você procura?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>

            {/* Categoria e Ordenação */}
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full h-11">
                  <div className="flex items-center text-gray-600">
                    <ListFilter className="h-4 w-4 mr-2" />
                    <span className="mr-2">Categoria:</span>
                  </div>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full h-11">
                  <div className="flex items-center text-gray-600">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <span className="mr-2">Ordenar:</span>
                  </div>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais Recentes</SelectItem>
                  <SelectItem value="price_asc">Menor Preço</SelectItem>
                  <SelectItem value="price_desc">Maior Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={itemVariants} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center p-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mt-2">Tente ajustar seus filtros ou buscar por um termo diferente.</p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => {
                setSearchTerm('')
                setCategory('all')
                setSortBy('newest')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsPage