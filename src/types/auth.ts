export interface Profile {
  id: string
  email: string
  role: 'cliente' | 'vendedor'
  store_name?: string | null
  store_description?: string | null
  store_logo?: string | null
  store_categories?: string[] | null
  created_at?: string
  updated_at?: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: Profile | null
}