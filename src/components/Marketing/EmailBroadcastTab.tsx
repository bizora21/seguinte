import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Send, Users, Store, Mail, Loader2, FileText, Eye, Search, Plus, ShoppingBag } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { renderToStaticMarkup } from 'react-dom/server'
import EmailTemplate from '../Templates/EmailTemplate'
import { Profile } from '../../types/auth'
import EmailEditor from './EmailEditor'
import { getFirstImageUrl } from '../../utils/images'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'

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

  // Buscar produtos para o painel lateral
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

  // Gera o HTML do card do produto para inserir no editor
  const generateProductHtml = (product: ProductSimple) => {
    const imageUrl = getFirstImageUrl(product.image_url) || 'https://lojarapidamz.com/placeholder.svg'
    const productLink = `https://lojarapidamz.com/produto/${product.id}`
    
    // HTML com estilos inline para compatibilidade com clientes de e-mail
    return `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <tr>
          <td align="center" style="padding: 0;">
            <a href="${productLink}" style="display: block; text-decoration: none;">
              <img src="${imageUrl}" alt="${product.name}" width="100%" style="display: block; width: 100%; max-height: 250px; object-fit: cover; border-top-left-radius: 8px; border-top-right-radius: 8px;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${product.seller?.store_name || 'Oferta LojaRápida'}</p>
            <h3 style="margin: 8px 0 12px 0; font-size: 18px; font-weight: bold; color: #111827;">${product.name}</h3>
            <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #059669;">${formatPrice(product.price)}</p>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <a href="${productLink}" style="background-color: #00D4AA; border: 1px solid #00D4AA; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; mso-padding-alt: 0;">
                    Comprar Agora &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <br />
    `
  }

  const handleInsertProduct = (product: ProductSimple) => {
    const productHtml = generateProductHtml(product)
    setBodyContent(prev => prev + productHtml)
    showSuccess('Produto adicionado ao e-mail!')
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
        <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
        
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
      showError('Selecione o público, assunto e adicione conteúdo.')
      return
    }

    if (!confirm(`Tem certeza? Isso enviará para TODOS os ${targetAudience === 'cliente' ? 'Clientes' : 'Vendedores'}.`)) {
      return
    }

    setSubmitting(true)
    const toastId = showLoading('Enviando campanha...')

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
      
      // Envio sequencial para não sobrecarregar
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
      showSuccess(`Campanha enviada para ${successCount} destinatários!`)
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Coluna Esquerda: Editor e Configurações */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-primary">
                    <Mail className="w-6 h-6 mr-2" />
                    Criar Campanha de Produtos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Público-Alvo</Label>
                            <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cliente">Clientes (Compradores)</SelectItem>
                                    <SelectItem value="vendedor">Vendedores (Lojistas)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input 
                                value={subject} 
                                onChange={e => setSubject(e.target.value)} 
                                placeholder="Ex: 🔥 Ofertas Relâmpago da Semana!" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Corpo do E-mail</Label>
                        <div className="border rounded-md">
                            <EmailEditor
                                initialContent={bodyContent}
                                onChange={setBodyContent}
                                disabled={submitting}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Use a barra lateral para inserir produtos rapidamente no corpo do texto.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Card */}
            {bodyContent && (
                <Card className="flex-1 min-h-[400px] flex flex-col border-blue-200 bg-blue-50/50">
                    <CardHeader className="py-3 border-b bg-white rounded-t-lg">
                        <CardTitle className="text-sm flex items-center text-gray-600">
                            <Eye className="w-4 h-4 mr-2" /> Preview em Tempo Real
                        </CardTitle>
                    </CardHeader>
                    <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
                        <iframe
                            srcDoc={fullHtmlPreview}
                            title="Email Preview"
                            className="w-full h-full min-h-[400px] border-0 bg-white rounded-md shadow-sm"
                        />
                    </div>
                    <div className="p-4 bg-white border-t rounded-b-lg">
                        <Button 
                            onClick={handleSendBroadcast} 
                            disabled={submitting || !bodyContent}
                            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-lg"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                            Enviar Campanha Agora
                        </Button>
                    </div>
                </Card>
            )}
        </div>

        {/* Coluna Direita: Seletor de Produtos */}
        <div className="lg:col-span-1 h-full">
            <Card className="h-full flex flex-col border-l-4 border-l-purple-500 shadow-lg">
                <CardHeader className="bg-purple-50 pb-3">
                    <CardTitle className="text-base font-bold text-purple-900 flex items-center">
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Catálogo de Produtos
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Buscar produto..." 
                            className="pl-8 bg-white border-purple-200"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden bg-gray-50/30">
                    <ScrollArea className="h-full p-4">
                        {loadingProducts ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">Nenhum produto encontrado.</div>
                        ) : (
                            <div className="space-y-3">
                                {products.map((product) => (
                                    <div key={product.id} className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex gap-3">
                                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={getFirstImageUrl(product.image_url) || '/placeholder.svg'} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm text-gray-900 truncate" title={product.name}>{product.name}</h4>
                                                <p className="text-xs text-gray-500 truncate">{product.seller?.store_name}</p>
                                                <p className="font-bold text-green-600 text-sm mt-1">{formatPrice(product.price)}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            className="w-full mt-3 bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200"
                                            onClick={() => handleInsertProduct(product)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Inserir no E-mail
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

export default EmailBroadcastTab