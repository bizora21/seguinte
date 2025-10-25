import { Product } from '../types/product'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Eye, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../contexts/CartContext'
import { showSuccess } from '../utils/toast'
import { getFirstImageUrl } from '../utils/images' // Importar utilitário

interface AnimatedProductCardProps {
  product: Product
}

const AnimatedProductCard = ({ product }: AnimatedProductCardProps) => {
  const { addToCart } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(price)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    addToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock
    })
    
    showSuccess(`${product.name} adicionado ao carrinho!`)
  }
  
  const imageUrl = getFirstImageUrl(product.image_url)
  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="p-0">
          <div className="aspect-square w-full overflow-hidden bg-gray-100">
            <motion.img
              src={imageUrl || defaultImage}
              alt={product.name}
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              onError={(e) => {
                e.currentTarget.src = defaultImage
              }}
            />
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
        <CardFooter className="p-4 pt-0 space-y-2">
          <Link to={`/produto/${product.id}`} className="w-full">
            <Button className="w-full" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </Link>
          <Button
            onClick={handleAddToCart}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? 'Fora de Estoque' : 'Adicionar'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default AnimatedProductCard