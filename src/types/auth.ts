export interface Profile {
  id: string
  email: string
  role: 'cliente' | 'vendedor'
  store_name?: string | null
  store_description?: string | null
  store_logo?: string | null
  store_categories?: string[] | null
  city?: string | null // Novo
  province?: string | null // Novo
  delivery_scope?: string[] | null // Novo: Escopo de entrega (provincias/cidades)
  phone?: string | null // Contacto do vendedor (WhatsApp/chamada), formato +258 8X XXX XXXX
  group_invite_shown?: number | null
  group_joined?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: Profile | null
}