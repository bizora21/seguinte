import { useCart } from '../contexts/CartContext'
import { Button } from './ui/button'
import { ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CartButton = () => {
  const { getCartItemsCount } = useCart()
  const navigate = useNavigate()
  const itemsCount = getCartItemsCount()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate('/carrinho')}
      className="relative"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Carrinho
      {itemsCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {itemsCount}
        </span>
      )}
    </Button>
  )
}

export default CartButton