import { ProductWithSeller } from '../types/product'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Eye, Store, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'

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

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <Link to={`/produto/${product.id}`}>
          <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-100">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <Link to={`/produto/${product.id}`}>
          <CardTitle className="text-lg mb-2 line-clamp-2 hover:text-green-700 transition-colors">
            {product.name}
          </CardTitle>
        </Link>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.description || 'Sem descrição'}
        </p>
        {product.seller && (
          <Link to={`/loja/${product.seller.id}`} className="inline-block mb-2">
            <div className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <Store className="w-4 h-4 mr-1" />
              <span>{product.seller.store_name || 'Loja do Vendedor'}</span>
            </div>
          </Link>
        )}
        <div className="text-2xl font-bold text-green-600">
          {formatPrice(product.price)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Estoque: {product.stock} unidades
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/confirmar-encomenda/${product.id}`} className="w-full">
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Encomendar Agora
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default ProductCard