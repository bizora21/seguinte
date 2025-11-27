import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Copy, Download, Share2, Package, Instagram, Facebook, MessageCircle, QrCode, Send, Smartphone, Wand2, Loader2 } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { Textarea } from '../ui/textarea'
import { supabase } from '../../lib/supabase'
import { Product } from '../../types/product'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { getFirstImageUrl } from '../../utils/images'

const SocialContentGenerator = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Estado para o conteúdo gerado (agora dinâmico)
  const [generatedContent, setGeneratedContent] = useState({
    whatsapp: '',
    facebook: '',
    instagram: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Buscar os 20 produtos mais recentes com estoque
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setProducts(data || [])
      if (data && data.length > 0) {
        setSelectedProductId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      showError('Erro ao carregar produtos')
    } finally {
      setLoadingProducts(false)
    }
  }
  
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId)
  }, [selectedProductId, products])

  const productLink = selectedProduct ? `https://lojarapidamz.com/produto/${selectedProduct.id}` : ''
  const imageUrl = useMemo(() => getFirstImageUrl(selectedProduct?.image_url), [selectedProduct])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleGenerateWithAI = async () => {
    if (!selectedProduct) return

    setGenerating(true)
    const toastId = showLoading('A IA está a criar legendas virais...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // 1. Gerar para Instagram/Facebook (estilo mais visual/hashtags)
      const responseInsta = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'generate_social_caption',
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          price: selectedProduct.price,
          platform: 'Instagram'
        })
      })
      
      // 2. Gerar para WhatsApp (estilo curto, direto, formatação *negrito*)
      const responseWhats = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'generate_social_caption',
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          price: selectedProduct.price,
          platform: 'WhatsApp (use * for bold, short text)'
        })
      })

      if (!responseInsta.ok || !responseWhats.ok) throw new Error('Falha na geração')

      const dataInsta = await responseInsta.json()
      const dataWhats = await responseWhats.json()

      const instaCaption = `${dataInsta.data.caption}\n\n${dataInsta.data.hashtags}`
      // Facebook usa um estilo similar ao Insta, mas talvez com menos hashtags
      const fbCaption = `${dataInsta.data.caption}\n\nCompre aqui: ${productLink}`
      
      // WhatsApp precisa do link no final
      const whatsCaption = `${dataWhats.data.caption}\n\n👉 Encomende aqui: ${productLink}`

      setGeneratedContent({
        instagram: instaCaption,
        facebook: fbCaption,
        whatsapp: whatsCaption
      })

      dismissToast(toastId)
      showSuccess('Legendas geradas com sucesso!')

    } catch (error) {
      console.error('AI Generation Error:', error)
      dismissToast(toastId)
      showError('Erro ao gerar com IA. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  // Gera conteúdo padrão se a IA ainda não foi usada
  useMemo(() => {
    if (!selectedProduct || generatedContent.whatsapp) return // Se já tem conteúdo gerado, não sobrescreve

    const price = formatPrice(selectedProduct.price)
    const name = selectedProduct.name

    setGeneratedContent({
        instagram: `✨ OFERTA: ${name} por ${price}! 🇲🇿\nLink na bio! #LojaRapida`,
        facebook: `Oferta: ${name} - ${price}. Compre agora: ${productLink}`,
        whatsapp: `*${name}*\n💰 ${price}\n👉 ${productLink}`
    })
  }, [selectedProduct, productLink])

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(`Legenda do ${platform} copiada!`)
  }
  
  const handleDownloadImage = () => {
    showSuccess('Imagem preparada para download! (Simulado)')
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Share2 className="w-6 h-6 mr-2 text-purple-600" />
          Gerador de Viralidade (Produtos Reais)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Produto */}
        <div className="space-y-2 bg-gray-50 p-4 rounded-lg border">
          <Label htmlFor="product-select" className="font-medium">
            Selecione um Produto do Estoque
          </Label>
          <Select
            value={selectedProductId || ''}
            onValueChange={(val) => {
                setSelectedProductId(val)
                // Limpar conteúdo gerado anteriormente para forçar nova geração ou default
                setGeneratedContent({ whatsapp: '', facebook: '', instagram: '' })
            }}
            disabled={loadingProducts || generating}
          >
            <SelectTrigger id="product-select" className="bg-white">
              <SelectValue placeholder={loadingProducts ? "Carregando produtos..." : "Escolha um produto"} />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} - {formatPrice(p.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Preview da Imagem e Ações */}
            <div className="lg:col-span-1 space-y-4">
              <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg border bg-black">
                <img 
                    src={imageUrl || '/placeholder.svg'} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover opacity-90" 
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                />
                
                {/* Overlay estilo Instagram Story */}
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-black">
                    LojaRápida
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                        <p className="font-bold text-lg leading-tight mb-1 line-clamp-2">{selectedProduct.name}</p>
                        <span className="text-2xl font-bold text-yellow-400">{formatPrice(selectedProduct.price)}</span>
                    </div>
                    <QrCode className="w-10 h-10 text-white bg-black p-1 rounded" />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleDownloadImage} className="w-full bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Baixar Imagem (Stories)
              </Button>
              
              <Button onClick={handleGenerateWithAI} disabled={generating} variant="outline" className="w-full border-purple-500 text-purple-700 hover:bg-purple-50">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                {generating ? 'Criando Mágica...' : 'Gerar Legendas com IA'}
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
                            Otimizado para Grupos e Status
                        </h4>
                        <Textarea 
                            value={generatedContent.whatsapp}
                            onChange={(e) => setGeneratedContent({...generatedContent, whatsapp: e.target.value})}
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
                            value={generatedContent.facebook} 
                            onChange={(e) => setGeneratedContent({...generatedContent, facebook: e.target.value})}
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
                            value={generatedContent.instagram} 
                            onChange={(e) => setGeneratedContent({...generatedContent, instagram: e.target.value})}
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
        )}
      </CardContent>
    </Card>
  )
}

export default SocialContentGenerator