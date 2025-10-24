import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { ProductWithSeller } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'

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
  })

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'eletronicos', label: 'Eletrônicos' },
    { value: 'moda', label: 'Moda' },
    { value: 'casa', label: 'Casa e Decoração' },
    { value: 'esportes', label: 'Esportes' },
  ]

  if (isError) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-red-600">Erro ao carregar produtos.</h2>
        <Button onClick={() => refetch()} className="mt-4">Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Produtos Disponíveis</h1>

        {/* Filtros e Ordenação */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Busca */}
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:max-w-sm"
            />

            {/* Categoria */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais Recentes</SelectItem>
                <SelectItem value="price_asc">Preço: Menor para Maior</SelectItem>
                <SelectItem value="price_desc">Preço: Maior para Menor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Produtos */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center p-10 bg-white rounded-lg shadow-md">
            <p className="text-lg text-gray-600">Nenhum produto encontrado com os filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsPage