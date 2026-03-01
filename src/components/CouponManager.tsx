import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, Copy, Gift, Percent, Clock, Users } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  discount: string
  description: string
  minPurchase: number
  maxUses: number
  currentUses: number
  expiresAt: string
}

const CouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: '1',
      code: 'BOASVINDAS50',
      discount: '50%',
      description: '50% de desconto na primeira compra',
      minPurchase: 500,
      maxUses: 100,
      currentUses: 45,
      expiresAt: '2026-03-31'
    },
    {
      id: '2',
      code: 'FRETEGRACK10',
      discount: '10% OFF',
      description: '10% de desconto em eletrónicos',
      minPurchase: 2000,
      maxUses: 50,
      currentUses: 12,
      expiresAt: '2026-03-15'
    },
    {
      id: '3',
      code: 'NOVO10',
      discount: '10 MZN',
      description: 'Desconto de 10 MZN para novos usuários',
      minPurchase: 200,
      maxUses: 200,
      currentUses: 89,
      expiresAt: '2026-04-30'
    }
  ])

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    description: '',
    minPurchase: 0
  })

  const createCoupon = () => {
    if (!newCoupon.code || !newCoupon.discount || !newCoupon.description) {
      alert('Preencha todos os campos!')
      return
    }

    const coupon: Coupon = {
      id: Math.random().toString(36),
      code: newCoupon.code.toUpperCase(),
      discount: newCoupon.discount,
      description: newCoupon.description,
      minPurchase: newCoupon.minPurchase || 0,
      maxUses: 100,
      currentUses: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    setCoupons([...coupons, coupon])
    setNewCoupon({ code: '', discount: '', description: '', minPurchase: 0 })
    alert('Cupom criado com sucesso!')
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Gift className="w-6 h-6 mr-2" />
            Criar Cupom de Desconto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="couponCode">Código do Cupom</Label>
              <Input
                id="couponCode"
                placeholder="Ex: PROMO50"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </div>

            <div>
              <Label htmlFor="discount">Desconto</Label>
              <Input
                id="discount"
                placeholder="Ex: 50% ou 100 MZN"
                value={newCoupon.discount}
                onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: 50% de desconto na primeira compra"
                value={newCoupon.description}
                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="minPurchase">Compra Mínima (MZN)</Label>
              <Input
                id="minPurchase"
                type="number"
                placeholder="0"
                value={newCoupon.minPurchase}
                onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: Number(e.target.value) })}
              />
            </div>
          </div>

          <Button
            onClick={createCoupon}
            className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Tag className="w-4 h-4 mr-2" />
            Criar Cupom
          </Button>
        </CardContent>
      </Card>

      {/* Cupons Ativos */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Cupons Ativos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">Cupom</div>
                      <div className="font-mono text-lg font-bold text-[#0A254A] bg-gray-100 px-3 py-1 rounded">
                        {coupon.code}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code)
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-green-600 font-semibold">
                      <Percent className="w-4 h-4 mr-1" />
                      {coupon.discount}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{coupon.description}</p>

                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {coupon.currentUses}/{coupon.maxUses} usos
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Exp: {new Date(coupon.expiresAt).toLocaleDateString('pt-MZ')}
                    </div>
                    <div>
                      Mínimo: {coupon.minPurchase} MZN
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${(coupon.currentUses / coupon.maxUses) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CouponManager
