export interface Product {
  id: string
  seller_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  stock: number
  created_at: string
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