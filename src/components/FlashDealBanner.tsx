import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Zap, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getFirstImageUrl } from '../utils/images'

interface FlashDealData {
  id: string
  product_id: string
  discount_price: number
  original_price: number
  ends_at: string
  sold_units: number
  total_units: number
  product: {
    name: string
    image_url: string
  }
}

const FlashDealBanner = () => {
  const [deal, setDeal] = useState<FlashDealData | null>(null)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    fetchActiveDeal()
  }, [])

  useEffect(() => {
    if (!deal) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(deal.ends_at).getTime()
      const distance = end - now

      if (distance < 0) {
        clearInterval(interval)
        setDeal(null) // Oferta acabou
        return
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [deal])

  const fetchActiveDeal = async () => {
    const { data } = await supabase
      .from('flash_deals')
      .select('*, product:products(name, image_url)')
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()
    
    if (data) setDeal(data)
  }

  if (!deal) return null

  const progress = (deal.sold_units / deal.total_units) * 100
  const savings = Math.round(((deal.original_price - deal.discount_price) / deal.original_price) * 100)
  const imageUrl = getFirstImageUrl(deal.product.image_url)

  return (
    <div className="w-full bg-gradient-to-r from-orange-500 to-red-600 p-1 mb-8 rounded-xl shadow-lg transform hover:scale-[1.01] transition-transform duration-300">
      <Card className="border-0 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            
            {/* Imagem + Badge de Desconto */}
            <div className="relative w-full md:w-1/3 aspect-video md:aspect-auto">
              <img 
                src={imageUrl || '/placeholder.svg'} 
                alt={deal.product.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-red-600 text-white font-black px-3 py-1 rounded-md text-lg shadow-md transform -rotate-3">
                -{savings}%
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center text-orange-600 font-bold mb-2 uppercase tracking-wide text-xs md:text-sm">
                <Zap className="w-4 h-4 mr-1 fill-current animate-pulse" />
                Oferta Relâmpago • Expira em breve
              </div>
              
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {deal.product.name}
              </h3>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-extrabold text-red-600">
                  {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', maximumFractionDigits: 0 }).format(deal.discount_price)}
                </span>
                <span className="text-gray-400 line-through text-sm">
                  {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', maximumFractionDigits: 0 }).format(deal.original_price)}
                </span>
              </div>

              {/* Barra de Progresso (Escassez Visual) */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-red-600 flex items-center"><Clock className="w-3 h-3 mr-1" /> {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-gray-600">{deal.total_units - deal.sold_units} unidades restantes</span>
                </div>
                <Progress value={progress} className="h-2.5 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-600" />
              </div>

              <Button 
                onClick={() => navigate(`/produto/${deal.product_id}`)}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold h-12 shadow-lg"
              >
                APROVEITAR AGORA <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FlashDealBanner