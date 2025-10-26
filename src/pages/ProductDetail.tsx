import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Package, Star, Shield, Truck, CreditCard, MessageCircle, Clock, AlertTriangle, Maximize, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { showSuccess, showError } from '../utils/toast';
import { SEO, generateProductSchema, generateBreadcrumbSchema } from '../components/SEO';
import { getFirstImageUrl } from '../utils/images';

// Interface para os dados do produto
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null; 
  stock: number;
  seller_id: string;
  seller?: {
    id: string;
    store_name: string;
    email: string;
    delivery_scope?: string[]; // Adicionado
  };
}

// Interface para as mensagens do chat
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  chat_id: string;
  sender?: {
    email: string;
    store_name?: string;
  };
}

const PROVINCE_LABELS: Record<string, string> = {
  'maputo_cidade': 'Maputo (Cidade)',
  'maputo_provincia': 'Maputo (Província)',
  'gaza': 'Gaza',
  'inhambane': 'Inhambane',
  'sofala': 'Sofala',
  'manica': 'Manica',
  'tete': 'Tete',
  'zambezia': 'Zambézia',
  'nampula': 'Nampula',
  'cabo_delgado': 'Cabo Delgado',
  'niassa': 'Niassa'
}

const ProductDetail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            seller:profiles!products_seller_id_fkey(id, store_name, email, delivery_scope)
          `)
          .eq('id', productId)
          .single();

        if (error) {
          setError('Produto não encontrado');
          setProduct(null);
          return;
        }

        setProduct(data);
        const images = getProductImages(data.image_url);
        setMainImage(images[0] || '');

      } catch (error) {
        setError('Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  useEffect(() => {
    if (!user || !product || !product.seller_id) return;

    if (user.id === product.seller_id) {
      setChatId('VENDEDOR_PROPRIO');
      return;
    }

    setupChat();
  }, [user, product, productId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupChat = async () => {
    if (!user || !product || !product.seller_id) return;

    setChatLoading(true);
    
    try {
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .eq('product_id', productId)
        .eq('client_id', user.id)
        .eq('seller_id', product.seller_id)
        .single();

      let currentChatId = existingChat?.id;

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar chat existente:', fetchError);
      }

      if (!currentChatId) {
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            product_id: productId,
            client_id: user.id,
            seller_id: product.seller_id,
          })
          .select('id')
          .single();
        
        if (createError) {
          showError('Erro ao iniciar conversa');
          return;
        }

        currentChatId = newChat.id;
      }

      setChatId(currentChatId);
      await fetchMessages(currentChatId);
      setupRealtimeSubscription(currentChatId);

    } catch (error) {
      showError('Erro ao configurar conversa');
    } finally {
      setChatLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(email, store_name)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error) {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const setupRealtimeSubscription = (chatId: string) => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          if (newMessage.sender_id !== user?.id) {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('email, store_name')
              .eq('id', newMessage.sender_id)
              .single();
            
            const messageWithSender: Message = {
              ...newMessage,
              sender: senderData || { email: 'Desconhecido' }
            };

            setMessages(prev => [...prev, messageWithSender]);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription em tempo real');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId || chatId === 'VENDEDOR_PROPRIO') return;

    setSending(true);
    const messageContent = newMessage.trim();

    const optimisticMessage: Message = {
      id: Date.now().toString(),
      chat_id: chatId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: {
        email: user.email,
        store_name: user.profile?.store_name
      }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: messageContent,
        });

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        showError('Erro ao enviar mensagem');
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEncomendar = () => {
    if (!user) {
      showError('Faça login para fazer uma encomenda');
      navigate('/login');
      return;
    }
    navigate(`/confirmar-encomenda/${productId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price);
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(dateString));
  };

  const isMyMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  const getProductImages = (imageUrl: string | null): string[] => {
    if (!imageUrl) return [];
    
    try {
      const urls = JSON.parse(imageUrl);
      if (Array.isArray(urls)) {
        return urls.filter(url => typeof url === 'string');
      }
    } catch (e) {
      if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        return [imageUrl];
      }
    }
    
    return [];
  };

  const productImages = getProductImages(product?.image_url || null);
  const storeName = product?.seller?.store_name || 'Loja do Vendedor';
  const productUrl = `https://lojarapidamz.com/produto/${productId}`;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
          <p className="text-gray-600 mb-6">{error || 'O produto que você procura não existe.'}</p>
          <Button onClick={() => navigate('/produtos')}>Voltar para produtos</Button>
        </div>
      </div>
    );
  }
  
  const productSchema = generateProductSchema(product as any, storeName);
  
  const breadcrumbs = [
    { name: 'Início', url: 'https://lojarapidamz.com/' },
    { name: 'Produtos', url: 'https://lojarapidamz.com/produtos' },
    { name: product.name, url: productUrl }
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  
  const deliveryScope = product.seller?.delivery_scope || [];
  // CORREÇÃO: Usar Object.keys para obter o número de províncias no objeto PROVINCE_LABELS
  const isNationalDelivery = deliveryScope.length === Object.keys(PROVINCE_LABELS).length;

  return (
    <>
      <SEO
        title={`${product.name} | ${storeName} | LojaRápida`}
        description={`${product.description || `Compre ${product.name} na LojaRápida. Preço: ${formatPrice(product.price)}. Frete grátis em Moçambique.`} ${product.stock > 0 ? 'Disponível para entrega.' : 'Produto temporariamente indisponível.'}`}
        image={productImages[0] || '/og-image.jpg'}
        url={productUrl}
        type="product"
        jsonLd={[productSchema, breadcrumbSchema]}
      />
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <h1 className="text-lg font-semibold ml-4 truncate max-w-[200px] sm:max-w-none">{product.name}</h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 hidden sm:flex">
                  <Shield className="w-3 h-3 mr-1" />
                  Compra Segura
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hidden sm:flex">
                  <Truck className="w-3 h-3 mr-1" />
                  Frete Grátis
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-full">
            {/* Coluna da Esquerda: Detalhes do Produto */}
            <div className="space-y-6">
              {/* Galeria de Imagens */}
              <Card>
                <CardContent className="p-6">
                  <div className="relative">
                    <img 
                      src={mainImage || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'} 
                      alt={`Imagem principal do produto ${product.name}`}
                      className="w-full h-96 object-contain rounded-lg bg-gray-100"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
                      }}
                    />
                    
                    {/* Botão de Zoom/Lightbox */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                          aria-label="Zoom na imagem"
                        >
                          <Maximize className="w-5 h-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
                        <img 
                          src={mainImage || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=900&fit=contain'} 
                          alt={`Zoom de ${product.name}`}
                          className="w-full h-full max-h-[90vh] object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {productImages.length > 1 && (
                    <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                      {productImages.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Miniatura ${index + 1} do produto ${product.name}`}
                          className={`w-20 h-20 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${
                            mainImage === url ? 'border-blue-500' : 'border-gray-200'
                          }`}
                          onClick={() => setMainImage(url)}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações do Produto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-green-600">
                      {formatPrice(product.price)}
                    </div>
                    <div className={`text-sm font-medium ${
                      product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.stock > 0 ? `${product.stock} unidades` : 'Fora de estoque'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Descrição</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {product.description || 'Nenhuma descrição disponível.'}
                    </p>
                  </div>

                  {/* Novo Bloco: Escopo de Entrega */}
                  <div className="space-y-2 border-t pt-4">
                    <h3 className="font-semibold flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Disponibilidade de Entrega
                    </h3>
                    {deliveryScope.length === 0 ? (
                      <p className="text-sm text-red-600">
                        ⚠️ O vendedor não definiu áreas de entrega. Contate-o para confirmar.
                      </p>
                    ) : isNationalDelivery ? (
                      <p className="text-sm text-green-600 font-medium">
                        ✅ Entrega disponível em todo Moçambique.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Entrega disponível nas seguintes áreas:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {deliveryScope.map(scope => (
                            <Badge key={scope} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              {PROVINCE_LABELS[scope] || scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 border-t pt-4">
                    <h3 className="font-semibold">Vendido por</h3>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{storeName}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                          <span>4.8 (125 vendas)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Por que comprar na LojaRápida?</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Shield className="w-4 h-4 mr-2 text-green-600" />
                        <span>Pagamento na entrega - pague só quando receber</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Truck className="w-4 h-4 mr-2 text-blue-600" />
                        <span>Frete grátis em todo Moçambique (1 a 5 dias úteis)</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                        <span>Suporte direto com o vendedor</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleEncomendar}
                    className="w-full"
                    size="lg"
                    disabled={product.stock === 0}
                  >
                    <Package className="w-5 h-5 mr-2" />
                    {product.stock === 0 ? 'Fora de Estoque' : 'Fazer Encomenda'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Coluna da Direita: Chat Integrado com Aviso de Segurança */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Converse com o vendedor</CardTitle>
                      <p className="text-sm text-gray-600">
                        {storeName}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                  {!user ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Faça login para conversar</h3>
                        <p className="text-gray-600 mb-4">
                          Entre na sua conta para tirar dúvidas diretamente com o vendedor
                        </p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                          Fazer Login
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {user.id === product.seller_id ? (
                        <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-600">
                          <p>Você é o vendedor deste produto. Não é possível iniciar um chat consigo mesmo.</p>
                        </div>
                      ) : (
                        <>
                          {/* Área de Mensagens */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatLoading ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                <p className="text-gray-600">Carregando conversa...</p>
                              </div>
                            ) : messages.length === 0 ? (
                              <div className="text-center py-8">
                                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Inicie a conversa!</p>
                                <p className="text-sm text-gray-500">
                                  Pergunte sobre o produto, frete ou formas de pagamento
                                </p>
                              </div>
                            ) : (
                              messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${isMyMessage(msg) ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                      isMyMessage(msg)
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                                  >
                                    <p className="break-words">{msg.content}</p>
                                    <p
                                      className={`text-xs mt-1 text-right ${
                                        isMyMessage(msg) ? 'text-blue-100' : 'text-gray-500'
                                      }`}
                                    >
                                      {formatTime(msg.created_at)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Aviso de Segurança */}
                          <div className="bg-yellow-50 border border-yellow-200 p-3 mx-4 mb-2">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-yellow-800">
                                <p className="font-medium mb-1">⚠️ Aviso de Segurança</p>
                                <p>Para sua segurança, siga as políticas do site e nunca compartilhe dados pessoais ou de pagamento fora deste chat.</p>
                              </div>
                            </div>
                          </div>

                          {/* Input de Mensagem */}
                          <div className="border-t p-4">
                            <div className="flex space-x-2">
                              <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Digite sua mensagem..."
                                disabled={sending || !chatId}
                                className="flex-1"
                              />
                              <Button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || sending || !chatId}
                                size="icon"
                              >
                                {sending ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              <Clock className="w-3 h-3 inline mr-1" />
                              O vendedor geralmente responde em poucos minutos
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;