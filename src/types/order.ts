export interface CartItem {
  id: string
  product_id: string
  name: string
  price: number
  image_url?: string
  stock: number
  quantity: number
}

export interface Order {
  id: string
  user_id: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  delivery_address: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    product: {
      name: string
      image_url?: string
    }
  })[]
}

export interface OrderFormData {
  delivery_address: string
}