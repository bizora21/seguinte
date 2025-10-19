export interface Profile {
  id: string
  email: string
  role: 'cliente' | 'vendedor'
  store_name?: string
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}