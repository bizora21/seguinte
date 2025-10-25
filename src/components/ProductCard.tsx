import { ProductWithSeller } from '../types/product'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Eye, Store, ShoppingCart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from './ui/badge'
import { getFirstImageUrl } from '../utils/images' // Importar utilitário

interface ProductCardProps {
  product: ProductWithSeller
}

const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  const formatStock = (stock: number) => {
    if (stock === 0) return 'Fora de estoque'
    if (stock <= 5) return `Apenas ${stock} unidades`
    return `${stock} unidades`
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50'
    if (stock <= 5) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }
  
  // Usar o utilitário para obter a URL da primeira imagem
  const imageUrl = getFirstImageUrl(product.image_url)
  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'

  return (
    <Card className="group h-full flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:shadow-2xl">
      {/* Imagem do Produto */}
      <CardHeader className="p-0 relative overflow-hidden">
        <Link 
          to={`/produto/${product.id}`}
          className="block aspect-square w-full"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <div className="relative w-full h-full bg-gray-100">
            <img
              src={imageUrl || defaultImage}
              alt={`Imagem do produto ${product.name}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = defaultImage
              }}
            />
            
            {/* Badge de Estoque */}
            <div className="absolute top-3 left-3">
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium ${getStockColor(product.stock)}`}
              >
                {formatStock(product.stock)}
              </Badge>
            </div>

            {/* Badge de Desconto (simulado) */}
            {product.stock > 0 && product.stock <= 3 && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-red-500 text-white text-xs font-bold">
                  ÚLTIMAS UNIDADES
                </Badge>
              </div>
            )}
          </div>
        </Link>
      </CardHeader>

      {/* Conteúdo do Produto */}
      <CardContent className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Nome do Produto */}
        <Link to={`/produto/${product.id}`}>
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
        </Link>

        {/* Descrição */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {product.description || 'Sem descrição disponível'}
        </p>

        {/* Informações do Vendedor */}
        {product.seller && (
          <Link 
            to={`/loja/${product.seller.id}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors group"
          >
            <Store className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{product.seller.store_name || 'Loja do Vendedor'}</span>
          </Link>
        )}

        {/* Avaliação (simulada) */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < 4
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">(4.8)</span>
        </div>

        {/* Preço */}
        <div className="flex items-baseline justify-between">
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {formatPrice(product.price)}
          </div>
          {product.stock > 0 && (
            <div className="hidden sm:block text-xs text-gray-500">
              <span className="line-through text-gray-400">
                {formatPrice(product.price * 1.2)}
              </span>
              <span className="text-green-600 font-semibold ml-1">-20%</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Ações - Botões Alinhados Verticalmente (Corrigido) */}
      <CardFooter className="p-3 sm:p-4 pt-0 space-y-2 flex flex-col">
        {/* 1. Botão Principal: Encomendar Agora (Azul) */}
        <Link 
          to={`/confirmar-encomenda/${product.id}`}
          className="w-full block"
        >
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg justify-center transition-colors"
            size="lg"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">
              {product.stock === 0 ? 'Fora de Estoque' : 'Encomendar Agora'}
            </span>
          </Button>
        </Link>
        
        {/* 2. Botão Secundário: Ver Detalhes (Cinza) */}
        <Link 
          to={`/produto/${product.id}`}
          className="w-full block"
        >
          <Button 
            variant="outline"
            className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium py-3 rounded-lg justify-center border-0 transition-colors"
            size="lg"
            disabled={product.stock === 0}
          >
            <Eye className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Ver Detalhes</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default ProductCard