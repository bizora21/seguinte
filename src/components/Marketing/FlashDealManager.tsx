import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { Zap, Clock, TrendingDown, Trash2, StopCircle } from 'lucide-react'
import { Product } from '../../types/product'

interface FlashDeal {
  id: string
  product_id: string
  discount_price: number
  original_price: number
  ends_at: string
  status: string
  sold_units: number
  total_units: number
  product: { name: string }
}

const FlashDealManager = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [deals, setDeals] = useState<FlashDeal[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [duration, setDuration] = useState('24') // Horas
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar produtos
      const { data: prodData } = await supabase
        .from('products')
        .select('id, name, price, stock, seller_id, created_at') // Added missing fields
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(50)
      
      setProducts(prodData as Product[] || [])

      // Buscar deals ativos
      const { data: dealData } = await supabase
        .from('flash_deals')
        .select('*, product:products(name)')
        .order('created_at', { ascending: false })
      
      setDeals(dealData || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDeal = async () => {
    if (!selectedProduct || !discountPrice) {
      showError('Selecione um produto e defina o preço promocional.')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    if (parseFloat(discountPrice) >= product.price) {
      showError('O preço promocional deve ser menor que o original.')
      return
    }

    setCreating(true)
    const toastId = showLoading('Criando oferta relâmpago...')

    try {
      const endDate = new Date()
      endDate.setHours(endDate.getHours() + parseInt(duration))

      const { error } = await supabase.from('flash_deals').insert({
        product_id: selectedProduct,
        original_price: product.price,
        discount_price: parseFloat(discountPrice),
        ends_at: endDate.toISOString(),
        total_units: Math.min(product.stock, 20), // Limita visualmente a 20 unidades para escassez
        sold_units: Math.floor(Math.random() * 5), // Fake social proof inicial (0 a 4 vendidos)
        status: 'active'
      })

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Oferta Relâmpago ativada! A escassez vai gerar vendas.')
      setDiscountPrice('')
      setSelectedProduct('')
      fetchData()

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCancelDeal = async (id: string) => {
    try {
      await supabase.from('flash_deals').delete().eq('id', id)
      showSuccess('Oferta encerrada.')
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Criador de Ofertas */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-700">
            <Zap className="w-5 h-5 mr-2 fill-orange-500" />
            Criar Nova Oferta Relâmpago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - (Atual: {formatPrice(p.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço Promocional (MZN)</Label>
              <div className="relative">
                <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                <Input 
                  type="number" 
                  className="pl-9 bg-white" 
                  placeholder="Ex: 2500"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">🔥 3 Horas (Extrema Urgência)</SelectItem>
                  <SelectItem value="6">6 Horas</SelectItem>
                  <SelectItem value="12">12 Horas</SelectItem>
                  <SelectItem value="24">24 Horas</SelectItem>
                  <SelectItem value="48">48 Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCreateDeal} 
            disabled={creating || !selectedProduct}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
          >
            {creating ? 'Ativando...' : 'ATIVAR MODO ESCASSEZ'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Ofertas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800">Ofertas Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma oferta relâmpago ativa.</p>
            ) : (
              deals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{deal.product?.name || 'Produto Removido'}</p>
                    <div className="flex items-center text-xs space-x-2 mt-1">
                      <span className="text-gray-500 line-through">{formatPrice(deal.original_price)}</span>
                      <span className="text-green-600 font-bold text-sm">{formatPrice(deal.discount_price)}</span>
                    </div>
                    <div className="flex items-center text-xs text-orange-600 mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Expira em: {new Date(deal.ends_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCancelDeal(deal.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FlashDealManager