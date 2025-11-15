import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Package, Star, Shield, Truck, Maximize, MapPin, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { SEO, generateProductSchema, generateBreadcrumbSchema } from '../components/SEO';
import { getFirstImageUrl, getAllImageUrls } from '../utils/images';
import ProductDetailSkeleton from '../components/ProductDetailSkeleton';
import ProductChat from '../components/ProductChat';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { motion } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
          .select(`*, seller:profiles!products_seller_id_fkey(id, store_name, email, delivery_scope)`)
          .eq('id', productId)
          .single();

        if (error) {
          setError('Produto não encontrado');
          setProduct(null);
          return;
        }

        setProduct(data);
        const firstImage = getFirstImageUrl(data.image_url);
        setMainImage(firstImage || defaultImage);
        
        // --- LOGS DE DEBUG ---
        console.log(`[DEBUG A] ID recebido: ${productId}`);
        console.log('[DEBUG B] Produto bruto do BD:', data);
        console.log('[DEBUG C] Caminho da imagem (image_url):', data.image_url);
        console.log('[DEBUG D] URL da primeira imagem (OG Image):', firstImage);
        // --- FIM LOGS DE DEBUG ---

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

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price);
  
  if (loading) return <ProductDetailSkeleton />;

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
  
  const productImages = getAllImageUrls(product.image_url || null);
  const storeName = product.seller?.store_name || 'Loja do Vendedor';
  const productUrl = `https://lojarapidamz.com/produto/${productId}`;
  
  // --- DADOS DINÂMICOS PARA SEO ---
  const seoImage = getFirstImageUrl(product.image_url); // URL absoluta do Supabase
  const ogTitle = `${product.name} | ${formatPrice(product.price)} - ${storeName}`;
  const ogDescription = `${product.description?.substring(0, 250) || 'Compre este produto incrível na LojaRápida. Pagamento na entrega e frete grátis em Moçambique.'} ${product.stock > 0 ? 'Disponível para entrega imediata.' : 'Fora de estoque.'}`;
  
  const productSchema = generateProductSchema(product as any, storeName);
  const breadcrumbs = [
    { name: 'Início', url: '/' },
    { name: 'Produtos', url: '/produtos' },
    { name: product.name, url: productUrl }
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  // --- FIM DADOS DINÂMICOS PARA SEO ---


  return (
    <>
      {product && (
        <SEO
          title={ogTitle}
          description={ogDescription}
          image={seoImage || undefined} // Passa o URL do produto ou undefined
          url={productUrl}
          type="product"
          jsonLd={[productSchema, breadcrumbSchema]}
        />
      )}
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink asChild><Link to="/produtos">Produtos</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>{product.name}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Coluna da Esquerda: Imagens (Ocupa 3 colunas) */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="lg:col-span-3 space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white border shadow-md">
                <img 
                  src={mainImage || defaultImage}
                  alt={`Imagem principal do produto ${product.name}`}
                  className="w-full h-full object-contain"
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
              {productImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {productImages.map((url, index) => (
                    <div 
                      key={index} 
                      className={`w-20 h-20 flex-shrink-0 aspect-square rounded-md cursor-pointer border-2 overflow-hidden ${mainImage === url ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'}`}
                      onClick={() => setMainImage(url)}
                    >
                      <img src={url} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Coluna da Direita: Informações e Ações (Ocupa 2 colunas) */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg border-0">
                <CardContent className="p-6 space-y-4">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                      <span>4.8 (125)</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <Link to={`/loja/${product.seller_id}`} className="flex items-center text-blue-600 hover:underline">
                      <Store className="w-4 h-4 mr-1" />
                      <span>{storeName}</span>
                    </Link>
                  </div>

                  <Separator />

                  <div className="text-3xl font-bold text-green-600">{formatPrice(product.price)}</div>
                  
                  <p className="text-gray-600 leading-relaxed text-sm">{product.description || 'Nenhuma descrição disponível.'}</p>

                  <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className={product.stock > 0 ? 'bg-green-100 text-green-800' : ''}>
                    {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
                  </Badge>

                  <Button onClick={handleEncomendar} className="w-full" size="lg" disabled={product.stock === 0}>
                    <Package className="w-5 h-5 mr-2" />
                    {product.stock === 0 ? 'Fora de Estoque' : 'Encomendar Agora'}
                  </Button>
                </CardContent>
              </Card>

              <ProductChat 
                productId={product.id}
                sellerId={product.seller_id}
                storeName={storeName}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;