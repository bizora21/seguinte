import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Send, Users, Mail, Loader2, Eye, Search, Plus, ShoppingBag, Smartphone, Monitor, FileText, Wand2, ArrowRight, LayoutGrid } from 'lucide-react'
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
  const [hookStyle, setHookStyle] = useState('urgent')
  
  const [bodyContent, setBodyContent] = useState('')
  const [contentToInsert, setContentToInsert] = useState<string | null>(null)
  
  const [previewText, setPreviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generatingHook, setGeneratingHook] = useState(false)
  
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

  // --- IA: GERAR GANCHO CURTO ---
  const handleGenerateHook = async () => {
    setGeneratingHook(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              action: 'generate_hook',
              topic: subject || 'Oferta Relâmpago',
              style: hookStyle
            })
        });

        const result = await response.json();
        if (result.success && result.hook) {
            setSubject(result.hook);
            showSuccess('Gancho gerado!');
        } else {
            throw new Error(result.error || 'Falha ao gerar');
        }
    } catch (error) {
        showError('Erro na IA. Tente digitar manualmente.');
    } finally {
        setGeneratingHook(false);
    }
  }

  // Gera o HTML do card do produto
  const generateProductHtml = (product: ProductSimple) => {
    const imageUrl = getFirstImageUrl(product.image_url) || 'https://lojarapidamz.com/placeholder.svg'
    const productLink = `https://lojarapidamz.com/produto/${product.id}`
    
    return `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px; margin-bottom: 10px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <tr>
          <td width="30%" style="padding: 0; vertical-align: middle;">
            <a href="${productLink}" style="display: block; text-decoration: none;">
              <img src="${imageUrl}" alt="${product.name}" width="100%" style="display: block; width: 80px; height: 80px; object-fit: cover;" />
            </a>
          </td>
          <td width="70%" style="padding: 10px; vertical-align: middle;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</h3>
            <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #059669;">${formatPrice(product.price)}</p>
            <a href="${productLink}" style="background-color: #f3f4f6; color: #111827; padding: 4px 8px; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; border: 1px solid #d1d5db;">
              Comprar
            </a>
          </td>
        </tr>
      </table>
    `
  }

  const handleInsertProduct = (product: ProductSimple) => {
    const productHtml = generateProductHtml(product)
    setContentToInsert(productHtml)
    showSuccess('Produto adicionado!')
  }

  // --- NOVO: Inserir Catálogo (Grid) ---
  const handleInsertCatalog = () => {
    if (products.length === 0) {
      showError('Nenhum produto disponível para criar o catálogo.');
      return;
    }

    const topProducts = products.slice(0, 4); // Pega os top 4
    let gridHtml = `<div style="width: 100%; margin: 20px 0;"><h3 style="text-align: center; color: #111827; margin-bottom: 15px;">Destaques da Semana</h3>`;
    
    // Cria uma tabela simples de 1 coluna para compatibilidade máxima em email, 
    // mas visualmente empilhada ou lado a lado dependendo do cliente de email (tabelas aninhadas)
    
    topProducts.forEach(product => {
       gridHtml += generateProductHtml(product);
    });

    gridHtml += `<div style="text-align: center; margin-top: 20px;"><a href="https://lojarapidamz.com/produtos" style="background-color: #00D4AA; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Todos os Produtos</a></div></div>`;

    setContentToInsert(gridHtml);
    showSuccess('Catálogo inserido com sucesso!');
  };

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
            Acessar Loja
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
            <Label>Assunto do E-mail (Gancho)</Label>
            <div className="flex gap-2">
                <Select value={hookStyle} onValueChange={setHookStyle}>
                    <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Estilo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="curiosity">Curiosidade</SelectItem>
                        <SelectItem value="offer">Oferta</SelectItem>
                        <SelectItem value="news">Novidade</SelectItem>
                    </SelectContent>
                </Select>
                
                <Input 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="Ex: 🔥 Ofertas Relâmpago!" 
                    className="flex-1"
                />
                
                <Button 
                    onClick={handleGenerateHook} 
                    disabled={generatingHook} 
                    variant="outline" 
                    className="border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100"
                    title="Gerar gancho curto com IA"
                >
                    {generatingHook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                </Button>
            </div>
        </div>
        
        {/* BOTÃO DE INSERIR CATÁLOGO */}
        <Button 
            onClick={handleInsertCatalog} 
            variant="secondary"
            className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 dashed"
        >
            <LayoutGrid className="w-4 h-4 mr-2" /> Inserir Catálogo (Top 4 Produtos)
        </Button>
      </div>

      <div className="flex-1 min-h-[300px] border rounded-md overflow-hidden bg-white flex flex-col shadow-sm">
          <div className="bg-gray-50 p-2 border-b text-xs text-gray-500 font-medium uppercase flex justify-between items-center">
            <span>Editor Visual</span>
            <Badge variant="outline" className="bg-white">HTML Ativo</Badge>
          </div>
          <EmailEditor
              initialContent={bodyContent}
              onChange={setBodyContent}
              disabled={submitting}
              contentToInsert={contentToInsert}
              onContentInserted={() => setContentToInsert(null)}
          />
      </div>
    </div>
  )

  const ProductsSection = () => (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      <div className="p-3 border-b bg-gray-50">
          <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                  placeholder="Buscar produto..." 
                  className="pl-8 bg-white h-9 text-sm"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
              />
          </div>
      </div>
      <ScrollArea className="flex-1 p-2">
          {loadingProducts ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhum produto encontrado.</div>
          ) : (
              <div className="space-y-2">
                  {products.map((product) => (
                      <div key={product.id} className="bg-white p-2 rounded border hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
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
                              size="icon" 
                              className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full shadow-sm"
                              onClick={() => handleInsertProduct(product)}
                              title="Adicionar ao e-mail"
                          >
                              <Plus className="w-4 h-4" />
                          </Button>
                      </div>
                  ))}
              </div>
          )}
      </ScrollArea>
    </div>
  )

  const PreviewSection = () => (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative">
      <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
        <span className="text-gray-300 text-xs font-mono flex items-center">
          <Eye className="w-3 h-3 mr-2" /> Visualização (Cliente)
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
      
      <div className="p-4 bg-gray-800 border-t border-gray-700 sticky bottom-0 z-20">
        <Button 
            onClick={handleSendBroadcast} 
            disabled={submitting || !bodyContent}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center"
        >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
            ENVIAR AGORA
        </Button>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* HEADER DE MODO MOBILE */}
      <div className="md:hidden mb-4">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor"><FileText className="w-4 h-4 mr-2" /> Editar</TabsTrigger>
            <TabsTrigger value="products"><ShoppingBag className="w-4 h-4 mr-2" /> Produtos</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-2" /> Visualizar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* DESKTOP LAYOUT (GRID 3 COLUNAS) */}
      <div className="hidden md:grid md:grid-cols-12 gap-6 h-full min-h-0">
        
        {/* COLUNA 1: EDITOR (45%) */}
        <Card className="md:col-span-5 flex flex-col h-full overflow-hidden shadow-md border-t-4 border-t-blue-500">
          <CardHeader className="py-3 border-b bg-gray-50">
            <CardTitle className="text-base flex items-center">
              <Mail className="w-4 h-4 mr-2 text-blue-600" /> Configuração & Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <EditorSection />
          </CardContent>
        </Card>

        {/* COLUNA 2: PRODUTOS (25%) */}
        <Card className="md:col-span-3 flex flex-col h-full overflow-hidden shadow-md border-t-4 border-t-purple-500">
          <CardHeader className="py-3 border-b bg-gray-50">
            <CardTitle className="text-base flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2 text-purple-600" /> Arrastar Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ProductsSection />
          </CardContent>
        </Card>

        {/* COLUNA 3: PREVIEW (30%) */}
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
            <div className="p-4 border-t">
               <Button onClick={() => setMobileTab('preview')} className="w-full" variant="outline">
                 Ir para Envio <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </div>
          </Card>
        )}

        {mobileTab === 'products' && (
          <Card className="h-full flex flex-col border-t-4 border-t-purple-500">
            <CardContent className="flex-1 overflow-hidden p-0 pt-0">
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