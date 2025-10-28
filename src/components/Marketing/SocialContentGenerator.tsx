import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Copy, Download, Share2, Package, Instagram, Facebook, MessageCircle, QrCode, Send } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'
import { Textarea } from '../ui/textarea'
import { supabase } from '../../lib/supabase'
import { Product } from '../../types/product'
import LoadingSpinner from '../LoadingSpinner'
import { Label } from '../ui/label' // Importação corrigida

// Simulação de produtos para seleção
const MOCK_PRODUCTS: Product[] = [
  { id: 'prod1', name: 'Smartphone Ultra Rápido MZ', price: 12500.00, stock: 10, seller_id: 'seller1', image_url: '["https://images.unsplash.com/photo-1510557880182-3d4d3c5994c9?w=400&h=400&fit=crop"]', created_at: new Date().toISOString() },
  { id: 'prod2', name: 'Tênis Esportivo Leve', price: 3500.00, stock: 50, seller_id: 'seller2', image_url: '["https://images.unsplash.com/photo-1542291026-7eec264c27fc?w=400&h=400&fit=crop"]', created_at: new Date().toISOString() },
  { id: 'prod3', name: 'Cadeira de Escritório Ergonômica', price: 8900.00, stock: 5, seller_id: 'seller3', image_url: '["https://images.unsplash.com/photo-1592078615299-032165cbe843?w=400&h=400&fit=crop"]', created_at: new Date().toISOString() },
]

const SocialContentGenerator = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(MOCK_PRODUCTS[0].id)
  const [loading, setLoading] = useState(false)
  
  // Em um sistema real, você buscaria os produtos do Supabase aqui
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
      whatsapp: `🚨 NOVIDADE! ${name} por ${price} MZN! 🇲🇿\n\nPagamento na Entrega. Frete Grátis.\n\nEncomende aqui: ${productLink}`
    }
  }, [selectedProduct, productLink])

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(`Legenda do ${platform} copiada para a área de transferência!`)
  }
  
  const handleDownloadImage = () => {
    // Simulação de download de imagem com QR Code (em um sistema real, isso exigiria um serviço de backend)
    showSuccess('Simulação: Imagem com QR Code gerada e baixada!')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Share2 className="w-6 h-6 mr-2 text-purple-600" />
          Gerador de Conteúdo Social
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Produto */}
        <div className="space-y-2">
          <Label htmlFor="product-select" className="font-medium">
            Selecione o Produto em Destaque
          </Label>
          <Select
            value={selectedProductId || ''}
            onValueChange={setSelectedProductId}
            disabled={loading}
          >
            <SelectTrigger id="product-select">
              <SelectValue placeholder="Escolha um produto para promover" />
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
              <h3 className="font-semibold">Preview do Post (1080x1080)</h3>
              <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg border">
                <img src={imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                
                {/* Simulação de QR Code e Preço */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-6 h-6 text-primary" />
                    <span className="text-sm">Link Rápido</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-400">{formatPrice(selectedProduct.price)}</span>
                </div>
              </div>
              
              <Button onClick={handleDownloadImage} className="w-full bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Baixar Imagem Pronta
              </Button>
              <Button onClick={() => showSuccess(`Link de material enviado para o vendedor ${selectedProduct.seller_id}`)} variant="outline" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Enviar Material ao Vendedor
              </Button>
            </div>

            {/* Coluna 2 & 3: Legendas Otimizadas */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold">Legendas Otimizadas</h3>
              
              {/* Instagram */}
              <div className="border p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium flex items-center"><Instagram className="w-4 h-4 mr-2 text-pink-600" /> Instagram</p>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedContent.instagram, 'Instagram')}>
                    <Copy className="w-4 h-4 mr-1" /> Copiar
                  </Button>
                </div>
                <Textarea readOnly value={generatedContent.instagram} rows={5} className="text-sm bg-gray-50" />
              </div>

              {/* Facebook */}
              <div className="border p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium flex items-center"><Facebook className="w-4 h-4 mr-2 text-blue-600" /> Facebook</p>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedContent.facebook, 'Facebook')}>
                    <Copy className="w-4 h-4 mr-1" /> Copiar
                  </Button>
                </div>
                <Textarea readOnly value={generatedContent.facebook} rows={5} className="text-sm bg-gray-50" />
              </div>

              {/* WhatsApp */}
              <div className="border p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium flex items-center"><MessageCircle className="w-4 h-4 mr-2 text-green-600" /> WhatsApp</p>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedContent.whatsapp, 'WhatsApp')}>
                    <Copy className="w-4 h-4 mr-1" /> Copiar
                  </Button>
                </div>
                <Textarea readOnly value={generatedContent.whatsapp} rows={3} className="text-sm bg-gray-50" />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3" />
            Selecione um produto para gerar o conteúdo de marketing.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SocialContentGenerator