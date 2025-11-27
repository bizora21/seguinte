import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Copy, Download, Share2, Package, Instagram, Facebook, MessageCircle, QrCode, Send, Smartphone } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'
import { Textarea } from '../ui/textarea'
import { supabase } from '../../lib/supabase'
import { Product } from '../../types/product'
import LoadingSpinner from '../LoadingSpinner'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

// Simulação de produtos para seleção
const MOCK_PRODUCTS: Product[] = [
  { id: 'prod1', name: 'Smartphone Ultra Rápido MZ', price: 12500.00, stock: 10, seller_id: 'seller1', image_url: '["https://images.unsplash.com/photo-1510557880182-3d4d3c5994c9?w=400&h=400&fit=crop"]', created_at: new Date().toISOString() },
  { id: 'prod2', name: 'Tênis Esportivo Leve', price: 3500.00, stock: 50, seller_id: 'seller2', image_url: '["https://images.unsplash.com/photo-1542291026-7eec264c27fc?w=400&h=400&fit=crop"]', created_at: new Date().toISOString() },
  { id: 'prod3', name: 'Cadeira de Escritório Ergonômica', price: 8900.00, stock: 5, seller_id: 'seller3', image_url: '["https://images.unsplash.com/photo-1592078615299-032165cbe843?w=400&h=400&fit=crop"]', created_at: new Date().toISOString() },
]

const SocialContentGenerator = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(MOCK_PRODUCTS[0].id)
  const [loading, setLoading] = useState(false)
  
  const selectedProduct = useMemo(() => {
    return MOCK_PRODUCTS.find(p => p.id === selectedProductId)
  }, [selectedProductId])

  const productLink = selectedProduct ? `https://lojarapidamz.com/produto/${selectedProduct.id}` : ''
  const imageUrl = selectedProduct ? JSON.parse(selectedProduct.image_url || '[]')[0] : ''

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0
    }).format(price)
  }

  const generatedContent = useMemo(() => {
    if (!selectedProduct) return null

    const price = formatPrice(selectedProduct.price)
    const name = selectedProduct.name

    return {
      instagram: `✨ OFERTA RELÂMPAGO! ✨\n\nCompre o ${name} por apenas ${price} MZN! Estoque limitado. Perfeito para você ou para presentear.\n\nClique no link da bio para encomendar agora! Pague na entrega em todo Moçambique! 🇲🇿\n\n#LojaRapida #Mozambique #OfertaDoDia #EcommerceMZ #${name.replace(/\s/g, '')}`,
      facebook: `🔥 PRODUTO EM DESTAQUE NA LOJARÁPIDA 🔥\n\nNão perca o ${name}!\n\nPreço incrível: ${price} MZN.\n\n✅ Pagamento na Entrega\n✅ Frete Grátis para todo Moçambique\n\nCompre agora e receba em 1 a 5 dias úteis. Clique no botão "Comprar Agora" ou visite nosso site: ${productLink}`,
      // Formatação específica para WhatsApp (*negrito*, emojis)
      whatsapp: `*🔥 SUPER OFERTA LOJARÁPIDA 🔥*\n\n📦 Produto: *${name}*\n💰 Preço: *${price} MZN*\n\n✅ *Pagamento na Entrega*\n✅ *Frete Grátis para todo País*\n\n🏃‍♂️ _Estoque limitado! Encomende antes que acabe:_\n👉 ${productLink}\n\n_Responda "QUERO" para reservar o seu!_`
    }
  }, [selectedProduct, productLink])

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(`Legenda do ${platform} copiada!`)
  }
  
  const handleDownloadImage = () => {
    showSuccess('Simulação: Imagem com QR Code gerada e baixada!')
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Share2 className="w-6 h-6 mr-2 text-purple-600" />
          Gerador de Viralidade (Social)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Produto */}
        <div className="space-y-2 bg-gray-50 p-4 rounded-lg border">
          <Label htmlFor="product-select" className="font-medium">
            Selecione o Produto para Promover
          </Label>
          <Select
            value={selectedProductId || ''}
            onValueChange={setSelectedProductId}
            disabled={loading}
          >
            <SelectTrigger id="product-select" className="bg-white">
              <SelectValue placeholder="Escolha um produto" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_PRODUCTS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} - {formatPrice(p.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProduct && generatedContent ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Preview da Imagem e Ações */}
            <div className="lg:col-span-1 space-y-4">
              <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg border bg-black">
                <img src={imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover opacity-90" />
                
                {/* Overlay estilo Instagram Story */}
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-black">
                    LojaRápida
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                        <p className="font-bold text-lg leading-tight mb-1">{selectedProduct.name}</p>
                        <span className="text-2xl font-bold text-yellow-400">{formatPrice(selectedProduct.price)}</span>
                    </div>
                    <QrCode className="w-10 h-10 text-white bg-black p-1 rounded" />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleDownloadImage} className="w-full bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Baixar Imagem (Stories/Status)
              </Button>
            </div>

            {/* Coluna 2 & 3: Abas de Plataforma */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="whatsapp" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="whatsapp" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                    </TabsTrigger>
                    <TabsTrigger value="facebook" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                        <Facebook className="w-4 h-4 mr-2" /> Facebook
                    </TabsTrigger>
                    <TabsTrigger value="instagram" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
                        <Instagram className="w-4 h-4 mr-2" /> Instagram
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="whatsapp" className="mt-4 space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                            <Smartphone className="w-4 h-4 mr-2" />
                            Perfeito para Listas de Transmissão e Grupos
                        </h4>
                        <Textarea 
                            readOnly 
                            value={generatedContent.whatsapp} 
                            rows={8} 
                            className="text-sm font-mono bg-white border-green-200 focus:ring-green-500" 
                        />
                        <Button onClick={() => handleCopy(generatedContent.whatsapp, 'WhatsApp')} className="w-full mt-3 bg-green-600 hover:bg-green-700">
                            <Copy className="w-4 h-4 mr-2" /> Copiar Texto Formatado
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="facebook" className="mt-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <Textarea 
                            readOnly 
                            value={generatedContent.facebook} 
                            rows={8} 
                            className="text-sm bg-white border-blue-200" 
                        />
                        <Button onClick={() => handleCopy(generatedContent.facebook, 'Facebook')} className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                            <Copy className="w-4 h-4 mr-2" /> Copiar Legenda
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="instagram" className="mt-4 space-y-4">
                    <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg">
                        <Textarea 
                            readOnly 
                            value={generatedContent.instagram} 
                            rows={8} 
                            className="text-sm bg-white border-pink-200" 
                        />
                        <Button onClick={() => handleCopy(generatedContent.instagram, 'Instagram')} className="w-full mt-3 bg-pink-600 hover:bg-pink-700">
                            <Copy className="w-4 h-4 mr-2" /> Copiar Legenda
                        </Button>
                    </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3" />
            Selecione um produto para gerar o conteúdo.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SocialContentGenerator