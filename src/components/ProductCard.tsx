import { Product } from '../types/product'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-0">
        <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
              }}
            />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <CardTitle className="text-lg mb-2 line-clamp-2">{product.name}</CardTitle>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.description || 'Sem descrição'}
        </p>
        <div className="text-2xl font-bold text-green-600">
          {formatPrice(product.price)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Estoque: {product.stock} unidades
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/produto/${product.id}`} className="w-full">
          <Button className="w-full" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default ProductCard