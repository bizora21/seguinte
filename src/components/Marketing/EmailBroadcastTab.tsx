import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Send, Users, Mail, Loader2, Eye, Search, Plus, ShoppingBag, Smartphone, Monitor, FileText } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { renderToStaticMarkup } from 'react-dom/server'
import EmailTemplate from '../Templates/EmailTemplate'
import { Profile } from '../../types/auth'
import EmailEditor from './EmailEditor'
import { getFirstImageUrl } from '../../utils/images'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/BpqBKP5aUnS0U195dvM52p?mode=wwt'

interface ProductSimple {
  id: string
  name: string
  price: number
  image_url: string
  seller: {
    store_name: string
  }
}

const EmailBroadcastTab: React.FC = () => {
  const [targetAudience, setTargetAudience] = useState<'cliente' | 'vendedor' | ''>('')
  const [subject, setSubject] = useState('')
  const [bodyContent, setBodyContent] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // --- Estados para Produtos ---
  const [products, setProducts] = useState<ProductSimple[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Estado de aba para mobile
  const [mobileTab, setMobileTab] = useState('editor')

  // Buscar produtos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        let query = supabase
          .from('products')
          .select('id, name, price, image_url, seller:profiles!products_seller_id_fkey(store_name)')
          .gt('stock', 0)
          .limit(20)
          .order('created_at', { ascending: false })

        if (productSearch) {
          query = query.ilike('name', `%${productSearch}%`)
        }

        const { data, error } = await query
        if (error) throw error
        // Type assertion to fix TS error where seller might be inferred as array
        setProducts((data as unknown as ProductSimple[]) || [])
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoadingProducts(false)
      }
    }

    const timeoutId = setTimeout(() => {
        fetchProducts()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [productSearch])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', maximumFractionDigits: 0 }).format(price)
  }

  // Gera o HTML do card do produto
  const generateProductHtml = (product: ProductSimple) => {
    const imageUrl = getFirstImageUrl(product.image_url) || 'https://lojarapidamz.com/placeholder.svg'
    const productLink = `https://lojarapidamz.com/produto/${product.id}`
    
    return `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px; margin-bottom: 15px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <tr>
          <td width="35%" style="padding: 0; vertical-align: middle;">
            <a href="${productLink}" style="display: block; text-decoration: none;">
              <img src="${imageUrl}" alt="${product.name}" width="100%" style="display: block; width: 100%; height: 120px; object-fit: cover;" />
            </a>
          </td>
          <td width="65%" style="padding: 15px; vertical-align: middle;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #111827;">${product.name}</h3>
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #059669;">${formatPrice(product.price)}</p>
            <a href="${productLink}" style="background-color: #00D4AA; color: #ffffff; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
              Comprar Agora &rarr;
            </a>
          </td>
        </tr>
      </table>
      <br />
    `
  }

  const handleInsertProduct = (product: ProductSimple) => {
    const productHtml = generateProductHtml(product)
    setBodyContent(prev => prev + productHtml)
    showSuccess('Produto inserido no editor!')
  }

  const getRecipientName = (profile: Pick<Profile, 'email' | 'store_name'>) => {
    if (profile.store_name && targetAudience === 'vendedor') {
      return profile.store_name
    }
    return profile.email.split('@')[0]
  }

  const generateFullHtmlPreview = (name: string) => {
    const contentWithButtons = (
      <>
        <div dangerouslySetInnerHTML={{ __html: bodyContent || '<p style="color:#999; text-align:center;">O conteúdo do seu e-mail aparecerá aqui...</p>' }} />
        
        <div className="button-container">
          <a 
            href="https://lojarapidamz.com/produtos" 
            className="button button-primary"
            style={{ backgroundColor: '#00D4AA', color: '#ffffff', border: '1px solid #00D4AA' }}
          >
            Ver Mais Ofertas
          </a>
          <a 
            href={WHATSAPP_GROUP_LINK} 
            className="button button-secondary"
            style={{ backgroundColor: '#ffffff', color: '#0A2540', border: '1px solid #0A2540' }}
          >
            Grupo WhatsApp
          </a>
        </div>
      </>
    )

    return renderToStaticMarkup(
      <EmailTemplate 
        title={subject || 'Ofertas Especiais'} 
        previewText={previewText || subject}
        recipientName={name}
      >
        {contentWithButtons}
      </EmailTemplate>
    )
  }

  const handleSendBroadcast = async () => {
    if (!targetAudience || !subject.trim() || !bodyContent.trim()) {
      showError('Preencha público, assunto e conteúdo.')
      return
    }

    if (!confirm(`CONFIRMAÇÃO: Enviar para TODOS os ${targetAudience === 'cliente' ? 'Clientes' : 'Vendedores'}?`)) {
      return
    }

    setSubmitting(true)
    const toastId = showLoading('Iniciando envio em massa...')

    try {
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('email, store_name')
        .eq('role', targetAudience)
        
      if (fetchError) throw fetchError
      
      const targetProfiles = profiles as Pick<Profile, 'email' | 'store_name'>[] || []
      
      if (targetProfiles.length === 0) {
        dismissToast(toastId)
        showError(`Nenhum destinatário encontrado.`)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const adminToken = session?.access_token

      let successCount = 0
      
      // Envio sequencial
      for (const profile of targetProfiles) {
        const recipientName = getRecipientName(profile)
        const htmlContent = generateFullHtmlPreview(recipientName)

        await supabase.functions.invoke('email-sender', {
            method: 'POST',
            body: { to: profile.email, subject: subject, html: htmlContent },
            headers: { 'Authorization': `Bearer ${adminToken}` }
        })
        successCount++
      }

      dismissToast(toastId)
      showSuccess(`Sucesso! E-mail enviado para ${successCount} pessoas.`)
      setSubject('')
      setBodyContent('')
      
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro no envio: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const previewName = targetAudience === 'vendedor' ? 'Loja Parceira' : 'Cliente Vip'
  const fullHtmlPreview = generateFullHtmlPreview(previewName)

  // --- COMPONENTES INTERNOS ---

  const EditorSection = () => (
    <div className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
            <Label>Público-Alvo</Label>
            <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                <SelectTrigger><SelectValue placeholder="Quem vai receber?" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="cliente">Clientes (Compradores)</SelectItem>
                    <SelectItem value="vendedor">Vendedores (Lojistas)</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label>Assunto do E-mail</Label>
            <Input 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                placeholder="Ex: 🔥 Ofertas Relâmpago!" 
            />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] border rounded-md overflow-hidden bg-white flex flex-col">
          <div className="bg-gray-100 p-2 border-b text-xs text-gray-500 font-medium uppercase">
            Área de Edição
          </div>
          <EmailEditor
              initialContent={bodyContent}
              onChange={setBodyContent}
              disabled={submitting}
          />
      </div>
    </div>
  )

  const ProductsSection = () => (
    <div className="flex flex-col h-full">
      <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
              placeholder="Buscar produtos..." 
              className="pl-8 bg-white"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
          />
      </div>
      <ScrollArea className="flex-1 pr-2">
          {loadingProducts ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhum produto encontrado.</div>
          ) : (
              <div className="space-y-2">
                  {products.map((product) => (
                      <div key={product.id} className="bg-white p-2 rounded border shadow-sm hover:border-primary transition-colors flex gap-2 items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              <img 
                                  src={getFirstImageUrl(product.image_url) || '/placeholder.svg'} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                              />
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs text-gray-900 truncate" title={product.name}>{product.name}</h4>
                              <p className="font-bold text-green-600 text-xs">{formatPrice(product.price)}</p>
                          </div>
                          <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                              onClick={() => handleInsertProduct(product)}
                              title="Adicionar ao e-mail"
                          >
                              <Plus className="w-5 h-5" />
                          </Button>
                      </div>
                  ))}
              </div>
          )}
      </ScrollArea>
    </div>
  )

  const PreviewSection = () => (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
      <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
        <span className="text-gray-300 text-xs font-mono flex items-center">
          <Eye className="w-3 h-3 mr-2" /> Visualização Mobile
        </span>
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
      
      <div className="flex-1 bg-white relative overflow-hidden">
        <iframe
            srcDoc={fullHtmlPreview}
            title="Email Preview"
            className="w-full h-full border-0"
            style={{ display: 'block' }}
        />
      </div>
      
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <Button 
            onClick={handleSendBroadcast} 
            disabled={submitting || !bodyContent}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 text-lg shadow-lg transition-all hover:scale-105"
        >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
            ENVIAR CAMPANHA
        </Button>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* HEADER DE MODO */}
      <div className="md:hidden mb-4">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor"><FileText className="w-4 h-4 mr-2" /> Editor</TabsTrigger>
            <TabsTrigger value="products"><ShoppingBag className="w-4 h-4 mr-2" /> Produtos</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-2" /> Enviar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* DESKTOP LAYOUT (GRID 3 COLUNAS) */}
      <div className="hidden md:grid md:grid-cols-12 gap-6 h-full min-h-0">
        
        {/* COLUNA 1: EDITOR (50%) */}
        <Card className="md:col-span-5 flex flex-col h-full overflow-hidden shadow-md border-t-4 border-t-blue-500">
          <CardHeader className="py-4 border-b bg-gray-50">
            <CardTitle className="text-lg flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" /> Editor de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <EditorSection />
          </CardContent>
        </Card>

        {/* COLUNA 2: PRODUTOS (25%) */}
        <Card className="md:col-span-3 flex flex-col h-full overflow-hidden shadow-md border-t-4 border-t-purple-500">
          <CardHeader className="py-4 border-b bg-gray-50">
            <CardTitle className="text-lg flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2 text-purple-600" /> Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
            <ProductsSection />
          </CardContent>
        </Card>

        {/* COLUNA 3: PREVIEW (25%) */}
        <div className="md:col-span-4 h-full flex flex-col">
          <PreviewSection />
        </div>
      </div>

      {/* MOBILE LAYOUT (ABAS) */}
      <div className="md:hidden flex-1 min-h-0">
        {mobileTab === 'editor' && (
          <Card className="h-full flex flex-col border-t-4 border-t-blue-500">
            <CardContent className="flex-1 overflow-y-auto p-4 pt-6">
              <EditorSection />
            </CardContent>
          </Card>
        )}

        {mobileTab === 'products' && (
          <Card className="h-full flex flex-col border-t-4 border-t-purple-500">
            <CardContent className="flex-1 overflow-hidden p-4 pt-6">
              <ProductsSection />
            </CardContent>
          </Card>
        )}

        {mobileTab === 'preview' && (
          <div className="h-full flex flex-col">
            <PreviewSection />
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailBroadcastTab