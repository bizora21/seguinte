import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getFirstImageUrl } from '../utils/images'

interface FlashDeal {
  id: string
  product_id: string
  discount_price: number
  original_price: number
  ends_at: string
  sold_units: number
  total_units: number
  product: { name: string; image_url: string }
}

const EXCLUDED_PREFIXES = ['/dashboard', '/admin', '/auth']
const EXCLUDED_EXACT = ['/login', '/register']
const ROTATE_MS = 6000
const REFETCH_MS = 5 * 60 * 1000

const formatPrice = (n: number) =>
  new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', maximumFractionDigits: 0 }).format(n)

const FlipDigit = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-12 h-14 md:w-14 md:h-16 bg-zinc-900/80 border border-white/10 rounded-lg overflow-hidden shadow-inner">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ transformPerspective: 400 }}
          className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-extrabold text-white tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className="text-[10px] uppercase tracking-wide text-zinc-400 mt-1">{label}</span>
  </div>
)

const FlashDealBanner = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [deals, setDeals] = useState<FlashDeal[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })

  const excluded =
    EXCLUDED_EXACT.includes(pathname) ||
    EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // Fetch + refetch a cada 5 min
  useEffect(() => {
    if (excluded) return
    let cancelled = false
    const fetchDeals = async () => {
      const { data, error } = await supabase
        .from('flash_deals')
        .select('id, product_id, discount_price, original_price, ends_at, sold_units, total_units, product:products(name, image_url)')
        .eq('status', 'active')
        .gt('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) console.error('FlashDeal fetch:', error)
      if (cancelled) return
      setDeals((data as unknown as FlashDeal[]) || [])
      setActiveIdx(0)
    }
    fetchDeals()
    const i = setInterval(fetchDeals, REFETCH_MS)
    return () => { cancelled = true; clearInterval(i) }
  }, [excluded])

  // Auto-rotate (pausa no hover)
  useEffect(() => {
    if (deals.length <= 1 || hovered) return
    const t = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % deals.length)
    }, ROTATE_MS)
    return () => clearInterval(t)
  }, [deals.length, hovered])

  // Countdown
  const deal = deals[activeIdx]
  useEffect(() => {
    if (!deal) return
    const tick = () => {
      const distance = new Date(deal.ends_at).getTime() - Date.now()
      if (distance <= 0) {
        setDeals((prev) => prev.filter((d) => d.id !== deal.id))
        return
      }
      setTimeLeft({
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      })
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [deal])

  if (excluded || !deal) return null

  const savings =
    deal.original_price > 0
      ? Math.round(((deal.original_price - deal.discount_price) / deal.original_price) * 100)
      : 0
  const stockProgress = Math.min(100, (deal.sold_units / Math.max(1, deal.total_units)) * 100)
  const stockLeft = Math.max(0, deal.total_units - deal.sold_units)
  const imageUrl = getFirstImageUrl(deal.product.image_url)
  const hh = String(timeLeft.hours).padStart(2, '0')
  const mm = String(timeLeft.minutes).padStart(2, '0')
  const ss = String(timeLeft.seconds).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mb-8"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#1a3a52] shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[16rem] md:min-h-[20rem]">

          {/* PAINEL ESQUERDO */}
          <div className="relative p-5 md:p-8 flex flex-col justify-center text-white order-2 md:order-1">
            <div className="inline-flex items-center gap-1.5 self-start mb-3">
              <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold uppercase tracking-wide">
                <Flame className="w-3.5 h-3.5" />
                Oferta Relâmpago
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              </span>
              {savings > 0 && (
                <span className="ml-1 px-2 py-1 rounded-md bg-red-600 text-white font-extrabold text-sm tracking-tight">
                  -{savings}%
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-3xl font-bold leading-tight mb-3 line-clamp-2">
              {deal.product.name}
            </h2>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl md:text-4xl font-extrabold text-amber-400">
                {formatPrice(deal.discount_price)}
              </span>
              {deal.original_price > deal.discount_price && (
                <span className="text-sm md:text-base text-zinc-400 line-through">
                  {formatPrice(deal.original_price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mb-4">
              <FlipDigit value={hh} label="horas" />
              <span className="text-2xl font-bold text-amber-400 self-start mt-2">:</span>
              <FlipDigit value={mm} label="min" />
              <span className="text-2xl font-bold text-amber-400 self-start mt-2">:</span>
              <FlipDigit value={ss} label="seg" />
            </div>

            <button
              onClick={() => navigate(`/produto/${deal.product_id}`)}
              className="group inline-flex items-center justify-center gap-2 self-start px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm md:text-base transition-all duration-200 hover:scale-105 hover:shadow-[0_0_24px_rgba(34,197,94,0.55)]"
            >
              Comprar Agora
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <div className="mt-4 w-full md:max-w-xs">
              <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                <span>Vendidos: {deal.sold_units}</span>
                <span className="font-semibold text-amber-300">{stockLeft} restantes</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-700"
                  style={{ width: `${stockProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO — IMAGEM */}
          <div className="relative flex items-center justify-center p-4 md:p-8 order-1 md:order-2 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.20),transparent_60%)]" />
            <img
              src={imageUrl || '/placeholder.svg'}
              alt={deal.product.name}
              className="relative z-10 max-h-48 md:max-h-64 object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)] animate-float"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={400}
              height={300}
            />
          </div>
        </div>

        {/* Dots de navegação (só se houver múltiplos deals) */}
        {deals.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {deals.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                aria-label={`Oferta ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIdx ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default FlashDealBanner
