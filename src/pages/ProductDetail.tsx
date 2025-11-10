import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Package, Star, Shield, Truck, Maximize, MapPin, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { SEO, generateProductSchema, generateBreadcrumbSchema } from '../components/SEO';
import { getFirstImageUrl } from '../utils/images';
import ProductDetailSkeleton from '../components/ProductDetailSkeleton';
import ProductChat from '../components/ProductChat';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

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
    delivery_scope?: string[];
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
  const [error, setError] = useState<string | null>(null);
  
  const defaultImage = '/placeholder.svg';

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
        setMainImage(images[0] || defaultImage);

      } catch (error) {
        setError('Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  const handleEncomendar = () => {
    if (!user) {
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
    return <ProductDetailSkeleton />;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Coluna da Esquerda: Imagens (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Imagem Principal (Forçando Aspecto Quadrado) */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white border shadow-md">
                <img 
                  src={mainImage || defaultImage}
                  alt={`Imagem principal do produto ${product.name}`}
                  className="w-full h-full object-contain"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = defaultImage; }}
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="icon" className="absolute top-4 right-4 bg-white/80 hover:bg-white" aria-label="Zoom na imagem">
                      <Maximize className="w-5 h-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
                    <img src={mainImage || defaultImage} alt={`Zoom de ${product.name}`} className="w-full h-full max-h-[90vh] object-contain" />
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Miniaturas */}
              {productImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {productImages.map((url, index) => (
                    <div 
                      key={index} 
                      className={`w-20 h-20 flex-shrink-0 aspect-square rounded-md cursor-pointer border-2 overflow-hidden ${mainImage === url ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'}`}
                      onClick={() => setMainImage(url)}
                    >
                      <img src={url} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna da Direita: Informações e Ações (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card de Preço e Ação */}
              <Card className="p-6 shadow-lg border-2 border-green-200">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                    <span>4.8 (125 avaliações)</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => navigate(`/loja/${product.seller_id}`)}>
                    <Store className="w-4 h-4 mr-1" />
                    <span>{storeName}</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-6">
                  <div className="text-4xl font-bold text-green-600">{formatPrice(product.price)}</div>
                  <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className={product.stock > 0 ? 'bg-green-100 text-green-800' : ''}>
                    {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
                  </Badge>
                </div>

                <Button onClick={handleEncomendar} className="w-full" size="lg" disabled={product.stock === 0}>
                  <Package className="w-5 h-5 mr-2" />
                  {product.stock === 0 ? 'Fora de Estoque' : 'Fazer Encomenda Agora'}
                </Button>
                
                <Separator className="my-6" />
                
                {/* Informações de Entrega e Vendedor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Truck className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-sm">Entrega Rápida</p>
                      <p className="text-xs text-gray-600">1 a 5 dias úteis em todo MZ</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-sm">Pagamento Seguro</p>
                      <p className="text-xs text-gray-600">Pague na Entrega (COD)</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />

                <div className="space-y-2">
                  <h3 className="font-semibold">Descrição</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{product.description || 'Nenhuma descrição disponível.'}</p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <h3 className="font-semibold flex items-center"><MapPin className="w-4 h-4 mr-2" />Disponibilidade de Entrega</h3>
                  {deliveryScope.length === 0 ? (
                    <p className="text-sm text-red-600">⚠️ O vendedor não definiu áreas de entrega. Contate-o para confirmar.</p>
                  ) : isNationalDelivery ? (
                    <p className="text-sm text-green-600 font-medium">✅ Entrega disponível em todo Moçambique.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {deliveryScope.map(scope => (
                        <Badge key={scope} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">{PROVINCE_LABELS[scope] || scope}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Componente de Chat (Fica abaixo das informações principais) */}
              <ProductChat 
                productId={product.id}
                sellerId={product.seller_id}
                storeName={storeName}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;