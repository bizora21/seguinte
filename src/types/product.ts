export interface Product {
  id: string
  seller_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  stock: number
  created_at: string
  category?: string // Adicionado
}

export interface ProductWithSeller extends Product {
  seller?: {
    id: string
    store_name: string
    email: string
  }
}

export interface ProductFormData {
  name: string
  description: string
  price: string
  images: string[]
  stock: string
}

// --- Novos Tipos para Avaliações ---
export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ReviewWithUser extends ProductReview {
  user: {
    email: string
    store_name: string | null
  }
}