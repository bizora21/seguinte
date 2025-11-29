import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Copy, Share2, Facebook, MessageCircle, Send, Smartphone, Wand2, Loader2, Search } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { supabase } from '../../lib/supabase'
import { Product } from '../../types/product'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { getFirstImageUrl } from '../../utils/images'
import { useDebounce } from '../../hooks/useDebounce'

const SocialContentGenerator = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [generating, setGenerating] = useState(false)
  
  const [generatedContent, setGeneratedContent] = useState({
    whatsapp: '',
    facebook: '',
    instagram: ''
  })

  // Buscar produtos para seleção
  const searchProducts = async (term: string) => {
    setLoadingProducts(true)
    try {
      let query = supabase
        .from('products')
        .select('*, seller:profiles(store_name)')
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(20)

      if (term) {
        query = query.ilike('name', `%${term}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const debouncedSearch = useDebounce(searchProducts, 500)

  useEffect(() => {
    searchProducts('')
  }, [])

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm])
  
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId)
  }, [selectedProductId, products])

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
      const productLink = `https://lojarapidamz.com/produto/${selectedProduct.id}?utm_source=social_share`

      setGeneratedContent({
        instagram: `${caption}\n\n🔥 PREÇO: ${formatPrice(selectedProduct.price)}\n🛒 ENCOMENDE AQUI: ${productLink}\n\n${hashtags}`,
        facebook: `${caption}\n\n🔥 PREÇO: ${formatPrice(selectedProduct.price)}\n🛒 ENCOMENDE AQUI: ${productLink}\n\n${hashtags}`,
        whatsapp: `*${selectedProduct.name}*\n🔥 Apenas ${formatPrice(selectedProduct.price)}\n\n${caption.substring(0, 150)}...\n\n👉 Peça aqui: ${productLink}`
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

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(`Legenda do ${platform} copiada!`)
  }

  return (
    <Card className="border shadow-md bg-white">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
        <CardTitle className="flex items-center text-xl text-purple-900">
          <Share2 className="w-6 h-6 mr-2 text-purple-600" />
          Motor de Viralidade (Produtos)
        </CardTitle>
        <p className="text-sm text-gray-500">Transforme produtos em posts virais em segundos.</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        
        {/* Passo 1: Busca e Seleção */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Label className="font-bold text-gray-700 flex items-center">
            <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
            Selecione o Produto
          </Label>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Digite o nome do produto para buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 mb-2 bg-white"
            />
          </div>

          <Select
            value={selectedProductId || ''}
            onValueChange={(val) => {
                setSelectedProductId(val)
                setGeneratedContent({ whatsapp: '', facebook: '', instagram: '' })
            }}
            disabled={loadingProducts || generating}
          >
            <SelectTrigger id="product-select" className="bg-white">
              <SelectValue placeholder={loadingProducts ? "Carregando..." : (selectedProduct ? selectedProduct.name : "Selecione na lista")} />
            </SelectTrigger>
            <SelectContent>
              {products.length === 0 ? (
                <div className="p-2 text-sm text-gray-500 text-center">Nenhum produto encontrado</div>
              ) : (
                products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-medium">{p.name}</span> 
                    <span className="text-gray-500 ml-2">({formatPrice(p.price)})</span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Coluna 1: Preview e Ações */}
            <div className="lg:col-span-1 space-y-4">
              <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg border bg-white group">
                <img 
                    src={imageUrl || '/placeholder.svg'} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-contain p-2" 
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 text-white backdrop-blur-sm">
                    <p className="font-bold text-sm truncate">{selectedProduct.name}</p>
                    <p className="text-yellow-400 font-bold">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateWithAI} 
                disabled={generating} 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md font-bold"
              >
                {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
                {generating ? 'Escrevendo Legenda...' : 'Gerar Post Completo'}
              </Button>
            </div>

            {/* Coluna 2 & 3: Abas de Plataforma */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="facebook" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="facebook" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 py-3">
                        <Facebook className="w-4 h-4 mr-2" /> Facebook / Instagram
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 py-3">
                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="facebook" className="flex-1 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg h-full flex flex-col">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                            <Send className="w-4 h-4 mr-2" />
                            Legenda de Engajamento
                        </h4>
                        <Textarea 
                            value={generatedContent.facebook} 
                            readOnly 
                            className="text-sm bg-white border-blue-200 flex-1 min-h-[200px] resize-none focus:ring-blue-500" 
                            placeholder="A legenda gerada pela IA aparecerá aqui..."
                        />
                        <Button onClick={() => handleCopy(generatedContent.facebook, 'Facebook')} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 h-12 font-bold">
                            <Copy className="w-5 h-5 mr-2" /> Copiar para Publicar
                        </Button>
                    </div>
                </TabsContent>
                
                <TabsContent value="whatsapp" className="flex-1 space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg h-full flex flex-col">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                            <Smartphone className="w-4 h-4 mr-2" />
                            Texto Otimizado para WhatsApp
                        </h4>
                        <Textarea 
                            value={generatedContent.whatsapp} 
                            readOnly 
                            className="text-sm font-mono bg-white border-green-200 focus:ring-green-500 flex-1 min-h-[200px] resize-none" 
                            placeholder="Texto curto e direto para grupos..."
                        />
                        <Button onClick={() => handleCopy(generatedContent.whatsapp, 'WhatsApp')} className="w-full mt-3 bg-green-600 hover:bg-green-700 h-12 font-bold">
                            <Copy className="w-5 h-5 mr-2" /> Copiar Texto
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