import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface TickerProduct {
  id: string
  name: string
  price: number
}

const EXCLUDED_PREFIXES = ['/dashboard', '/admin', '/auth']
const EXCLUDED_EXACT = ['/login', '/register']

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-MZ', { maximumFractionDigits: 0 }).format(price)

const ProductTickerBanner = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [products, setProducts] = useState<TickerProduct[]>([])

  useEffect(() => {
    let cancelled = false

    const fetchProducts = async () => {
      const { data: featured, error: errFeatured } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('featured', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(8)

      if (errFeatured) console.error('Ticker featured fetch:', errFeatured)
      if (cancelled) return

      if (featured && featured.length >= 3) {
        setProducts(featured)
        return
      }

      const { data: recent, error: errRecent } = await supabase
        .from('products')
        .select('id, name, price')
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(6)

      if (errRecent) console.error('Ticker recent fetch:', errRecent)
      if (!cancelled) setProducts(recent || [])
    }

    fetchProducts()
    const interval = setInterval(fetchProducts, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const excluded =
    EXCLUDED_EXACT.includes(pathname) ||
    EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // Esconde se < 3 produtos: a duplicação x2 não enche o ecrã e o "loop" parece repetição imediata.
  if (excluded || products.length < 3) return null

  // Duplica a lista para o loop seamless (translateX(-50%) alinha as duas cópias)
  const items = [...products, ...products]

  return (
    <div className="w-full bg-zinc-900 text-white h-12 md:h-14 flex items-center overflow-hidden border-b border-zinc-800">
      {/* Label fixo à esquerda */}
      <div className="flex-shrink-0 flex items-center px-3 md:px-4 h-full bg-zinc-900 border-r border-zinc-700 z-10">
        <span className="text-xs md:text-sm font-bold tracking-wide whitespace-nowrap text-amber-400">
          🔥 EM DESTAQUE
        </span>
      </div>

      {/* Ticker */}
      <div className="flex-1 overflow-hidden">
        <div className="animate-ticker flex w-max">
          {items.map((product, i) => (
            <button
              key={`${product.id}-${i}`}
              type="button"
              onClick={() => navigate(`/produto/${product.id}`)}
              aria-label={`Ver ${product.name} por ${formatPrice(product.price)} meticais`}
              aria-hidden={i >= products.length}
              tabIndex={i >= products.length ? -1 : 0}
              className="inline-flex items-center gap-2 px-4 md:px-6 text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 text-white"
            >
              <span>🔥</span>
              <span>{product.name}</span>
              <span className="text-amber-400 font-semibold">
                {formatPrice(product.price)} MZN
              </span>
              <span className="text-zinc-500 ml-2">·</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductTickerBanner
