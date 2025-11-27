import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Copy, Download, Share2, Package, Facebook, MessageCircle, QrCode, Send, Smartphone, Wand2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
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
  const [publishing, setPublishing] = useState(false)
  
  // Estado para o conteúdo gerado
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
      
      const response = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator', {
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
          platform: 'Facebook'
        })
      })

      if (!response.ok) throw new Error('Falha na geração')

      const data = await response.json()

      const caption = data.data.caption
      const hashtags = data.data.hashtags || '#LojaRapida #Mocambique #VendasOnline'

      const fbContent = `${caption}\n\n🔥 PREÇO: ${formatPrice(selectedProduct.price)}\n🛒 ENCOMENDE AQUI: ${productLink}\n\n${hashtags}`
      
      setGeneratedContent({
        instagram: fbContent, // Reutilizando por enquanto
        facebook: fbContent,
        whatsapp: `*${selectedProduct.name}*\n🔥 Apenas ${formatPrice(selectedProduct.price)}\n\n${caption.substring(0, 100)}...\n\n👉 Peça aqui: ${productLink}`
      })

      dismissToast(toastId)
      showSuccess('Legenda gerada com sucesso!')

    } catch (error) {
      console.error('AI Generation Error:', error)
      dismissToast(toastId)
      showError('Erro ao gerar com IA. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  const handlePublishToFacebook = async () => {
    if (!generatedContent.facebook || !selectedProduct) return
    
    setPublishing(true)
    const toastId = showLoading('Publicando na Página do Facebook...')
    
    try {
      // Obter sessão atual
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/social-media-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'publish_now',
          platform: 'facebook',
          content: generatedContent.facebook,
          imageUrl: imageUrl // Enviar a imagem do produto
        })
      })
      
      const result = await response.json()
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro na publicação')
      }
      
      dismissToast(toastId)
      showSuccess('Publicado com sucesso no Facebook!')
      
    } catch (error: any) {
      console.error('Publish Error:', error)
      dismissToast(toastId)
      showError(`Falha ao publicar: ${error.message}`)
    } finally {
      setPublishing(false)
    }
  }

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(`Legenda do ${platform} copiada!`)
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Share2 className="w-6 h-6 mr-2 text-purple-600" />
          Motor de Viralidade (Produtos)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Produto */}
        <div className="space-y-2 bg-gray-50 p-4 rounded-lg border">
          <Label htmlFor="product-select" className="font-medium">
            1. Selecione um Produto para Promover
          </Label>
          <Select
            value={selectedProductId || ''}
            onValueChange={(val) => {
                setSelectedProductId(val)
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
              <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg border bg-white">
                <img 
                    src={imageUrl || '/placeholder.svg'} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-contain p-2" 
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 text-white">
                    <p className="font-bold text-sm truncate">{selectedProduct.name}</p>
                    <p className="text-yellow-400 font-bold">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateWithAI} 
                disabled={generating} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
              >
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                {generating ? 'Criando Copy...' : '2. Gerar Legenda IA'}
              </Button>
            </div>

            {/* Coluna 2 & 3: Abas de Plataforma */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="facebook" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="facebook" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                        <Facebook className="w-4 h-4 mr-2" /> Facebook (Auto)
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp (Manual)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="facebook" className="mt-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-blue-800 flex items-center">
                                <Send className="w-4 h-4 mr-2" /> Postagem Automática
                            </h4>
                            {!generatedContent.facebook && <span className="text-xs text-blue-600">Gere a legenda primeiro</span>}
                        </div>
                        
                        <Textarea 
                            value={generatedContent.facebook} 
                            onChange={(e) => setGeneratedContent({...generatedContent, facebook: e.target.value})}
                            rows={10} 
                            placeholder="A legenda gerada pela IA aparecerá aqui..."
                            className="text-sm bg-white border-blue-200 min-h-[200px]" 
                        />
                        
                        <div className="mt-4 flex gap-3">
                            <Button 
                                onClick={handlePublishToFacebook} 
                                disabled={publishing || !generatedContent.facebook}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Facebook className="w-4 h-4 mr-2" />}
                                {publishing ? 'Publicando...' : '3. Publicar Agora'}
                            </Button>
                            <Button onClick={() => handleCopy(generatedContent.facebook, 'Facebook')} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100">
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Isso publicará a imagem do produto e o texto acima na sua Página do Facebook conectada.
                        </p>
                    </div>
                </TabsContent>
                
                <TabsContent value="whatsapp" className="mt-4 space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                            <Smartphone className="w-4 h-4 mr-2" />
                            Texto para Grupos/Status
                        </h4>
                        <Textarea 
                            value={generatedContent.whatsapp}
                            onChange={(e) => setGeneratedContent({...generatedContent, whatsapp: e.target.value})}
                            rows={10} 
                            className="text-sm font-mono bg-white border-green-200 focus:ring-green-500 min-h-[200px]" 
                        />
                        <Button onClick={() => handleCopy(generatedContent.whatsapp, 'WhatsApp')} className="w-full mt-3 bg-green-600 hover:bg-green-700">
                            <Copy className="w-4 h-4 mr-2" /> Copiar Texto
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