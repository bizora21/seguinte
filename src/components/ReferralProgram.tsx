import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gift, Users, Copy, CheckCircle, Share2, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ReferralProgram = () => {
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    totalEarned: 0
  })

  // Simular dados de exemplo
  React.useEffect(() => {
    setReferralCode('LOJA' + Math.random().toString(36).substring(2, 8).toUpperCase())
    setStats({
      totalReferrals: 15,
      successfulReferrals: 8,
      totalEarned: 2500
    })
  }, [])

  const referralLink = `https://lojarapidamz.com/?ref=${referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnWhatsApp = () => {
    const text = `🛒 Olá! Encontrei o maior marketplace de Moçambique - a LojaRápida!

Use meu link de convite e ganhe descontos exclusivos:
${referralLink}

Compre de tudo, em qualquer lugar de Moçambique, com entrega rápida!`

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-900">
            <Gift className="w-6 h-6 mr-2" />
            Ganhe Dinheiro Indicando Amigos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Seu código de indicação</p>
                <p className="text-2xl font-bold text-[#0A2540]">{referralCode}</p>
              </div>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="hover:bg-green-50 hover:border-green-300"
              >
                {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>

            <div className="p-4 bg-white rounded-lg">
              <Label htmlFor="referralLink" className="text-sm text-gray-600 mb-2">
                Seu link de indicação
              </Label>
              <div className="flex gap-2">
                <Input
                  id="referralLink"
                  value={referralLink}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={shareOnWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar no WhatsApp
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Convidar Amigos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              <p className="text-sm text-gray-600">Indicações</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.successfulReferrals}</p>
              <p className="text-sm text-gray-600">Cadastros</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalEarned.toLocaleString()} MZN</p>
              <p className="text-sm text-gray-600">Ganho total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Como Funciona */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Como Funciona o Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">1</div>
              <p className="text-gray-700"><strong>Compartilhe seu link</strong> com amigos e familiares pelo WhatsApp ou redes sociais</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">2</div>
              <p className="text-gray-700"><strong>Eles se cadastram</strong> usando seu link e ganham 50 MZN de desconto na primeira compra</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">3</div>
              <p className="text-gray-700"><strong>Você ganha 100 MZN</strong> para cada amigo que fizer o primeiro pedido</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">4</div>
              <p className="text-gray-700"><strong>Ganhe 5%</strong> de comissão em todas as compras futuras dos seus indicados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReferralProgram
