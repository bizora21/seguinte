import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useWishlist } from '../contexts/WishlistContext'
import { ProductWithSeller } from '../types/product'
import ProductCard from '../components/ProductCard'
import ProductCardSkeleton from '../components/ProductCardSkeleton'
import { Button } from '../components/ui/button'
import { SEO } from '../components/SEO'

const WishlistPage = () => {
  const { wishlist } = useWishlist()
  const [products, setProducts] = useState<ProductWithSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true)
      if (wishlist.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('products')
        .select(`*, seller:profiles!products_seller_id_fkey(id, store_name, email)`)
        .in('id', wishlist)

      setProducts((data ?? []) as ProductWithSeller[])
      setLoading(false)
    }

    fetchWishlistProducts()
  }, [wishlist])

  return (
    <>
      <SEO
        title="Lista de Desejos | LojaRápida"
        description="Os seus produtos guardados na LojaRápida."
        url="https://lojarapidamz.com/wishlist"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-7 h-7 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">Lista de Desejos</h1>
            {wishlist.length > 0 && (
              <span className="text-sm text-gray-500">({wishlist.length} produtos)</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">A sua lista está vazia</h2>
              <p className="text-gray-500 mb-6">Guarde produtos clicando no ❤️ nos cards.</p>
              <Button asChild>
                <Link to="/produtos">Explorar Produtos</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default WishlistPage
