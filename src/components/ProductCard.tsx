import { useMemo } from 'react'
import { ProductWithSeller } from '../types/product'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Eye, Store, ShoppingCart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from './ui/badge'
import { getFirstImageUrl } from '../utils/images'

interface ProductCardProps {
  product: ProductWithSeller
}

const ProductCard = ({ product }: ProductCardProps) => {
  // Otimização: Memoizar a URL da imagem para evitar processamento em cada render
  const imageUrl = useMemo(() => getFirstImageUrl(product.image_url), [product.image_url])
  const defaultImage = '/placeholder.svg'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0, // Remover centavos para visual mais limpo
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatStock = (stock: number) => {
    if (stock === 0) return 'Esgotado'
    if (stock <= 5) return `Restam ${stock}`
    return `${stock} un.`
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50 border-red-100'
    if (stock <= 5) return 'text-orange-600 bg-orange-50 border-orange-100'
    return 'text-green-600 bg-green-50 border-green-100'
  }

  return (
    <Card className="group h-full flex flex-col hover:shadow-xl transition-all duration-300 border border-gray-100 shadow-sm bg-white overflow-hidden">
      {/* Imagem do Produto - Aspect Ratio Quadrado Fixo */}
      <CardHeader className="p-0 relative border-b border-gray-50">
        <Link 
          to={`/produto/${product.id}`}
          className="block aspect-square w-full overflow-hidden bg-gray-100 relative"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <img
            src={imageUrl || defaultImage}
            alt={`Produto ${product.name}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            onError={(e) => {
              e.currentTarget.src = defaultImage
            }}
          />
          
          {/* Badge de Estoque */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant="outline" 
              className={`text-[10px] px-2 py-0.5 font-semibold border ${getStockColor(product.stock)}`}
            >
              {formatStock(product.stock)}
            </Badge>
          </div>

          {/* Badge de Oferta (Simulado se preço for alto ou aleatório para demo) */}
          {product.stock > 0 && product.stock <= 3 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold border-0 px-2">
                OFERTA
              </Badge>
            </div>
          )}
        </Link>
      </CardHeader>

      {/* Conteúdo do Produto */}
      <CardContent className="flex-1 p-4 flex flex-col">
        {/* Nome do Produto - Altura mínima fixa para alinhar cards vizinhos */}
        <Link to={`/produto/${product.id}`} className="mb-2 block">
          <CardTitle 
            className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight hover:text-primary transition-colors h-10"
            title={product.name}
          >
            {product.name}
          </CardTitle>
        </Link>

        {/* Informações do Vendedor e Avaliação */}
        <div className="flex items-center justify-between mb-3 text-xs">
          {product.seller && (
            <Link 
              to={`/loja/${product.seller.id}`}
              className="flex items-center text-gray-500 hover:text-blue-600 transition-colors truncate max-w-[60%]"
            >
              <Store className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{product.seller.store_name || 'Loja'}</span>
            </Link>
          )}
          <div className="flex items-center text-yellow-500">
            <Star className="w-3 h-3 fill-current mr-1" />
            <span className="text-gray-600 font-medium">4.8</span>
          </div>
        </div>

        {/* Preço */}
        <div className="mt-auto flex items-baseline gap-2">
          <div className="text-xl font-bold text-green-600">
            {formatPrice(product.price)}
          </div>
          {product.stock > 0 && (
            <div className="text-xs text-gray-400 line-through decoration-red-400">
              {formatPrice(product.price * 1.15)}
            </div>
          )}
        </div>
      </CardContent>

      {/* Ações - Sempre alinhadas no fundo */}
      <CardFooter className="p-4 pt-0 grid grid-cols-5 gap-2">
        <Link 
          to={`/confirmar-encomenda/${product.id}`}
          className="col-span-4"
        >
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 text-sm shadow-sm transition-all active:scale-95"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? 'Esgotado' : 'Comprar'}
          </Button>
        </Link>
        
        <Link 
          to={`/produto/${product.id}`}
          className="col-span-1"
        >
          <Button 
            variant="outline"
            className="w-full px-0 border-gray-200 hover:bg-gray-50 hover:text-blue-600 h-9"
            title="Ver Detalhes"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default ProductCard